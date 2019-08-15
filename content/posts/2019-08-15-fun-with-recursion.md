---
title: "Fun with recursion"
slug: "fun-with-recursion"
description: ""
date: 2019-08-15 00:54:07
author: "Waju"
tags: ["javascript", "jest", "TDD"]
cover: /images/posts/recursion.jpg
---

## Introduction

We all agree [Recursion is hard](https://twitter.com/kvlly/status/1153687468425777153) … however, it's a powerful tool that can make some algorithms clearer and more expressive. It's often avoided because of issues with infinite loops and stuff, but that need not be the case. I recently had an idea, which I will share at the end of the post. and one of the tools I would need is a way to convert the keys of an Object between cases, say snake_case to camelCase or the reverse. In this post, I journal how I go about building these tools with a recursive algorithm and a dash of TDD.

## Divide and conquer.

Before we get fancy it'd be nice to break up the problem into small parts, I am not always certain about the which small parts I will need, or how fine-grained each needs to be, however, its good to just make a good estimate and start coding. like the title of this blog, form a strong opinion but hold on to it weakly. It's fairly obvious I will need a function to convert to `snake_case` and another to convert to `camelCase` let's start here with some tests.

```javascript
const { snakeCase } = require("../src/utils/snakeCase");

describe("Snake Case", () => {
    test("Returns a string, given a String as input", () => {
        expect(typeof snakeCase("hi")).toBe("string");
    });

    test("Converts an input string to snakeCase", () => {
        expect(snakeCase("someVariable")).toBe("some_variable");
    });
});
```

in keeping with the textbook definition of TDD, I'd write the least bit of code to get this passing. however that will not be optimal for this medium, also this function is not the star of the show. so here goes.

```javascript
const snakeCase = str =>
    str.replace(
        /[A-Z]/g,

        (letter, index) => `${index !== 0 ? "_" : ""}${letter.toLowerCase()}`
    );

module.exports = { snakeCase };
```

You may have noticed [I did not use default exports](https://humanwhocodes.com/blog/2019/01/stop-using-default-exports-javascript-module/).

and for the camelCase conversion,

```javascript
const { camelCase } = require("./../src/utils/camelCase");

describe("Camel Case", () => {
    test("Returns a string, given a String as input", () => {
        expect(typeof camelCase("hi")).toBe("string");
    });

    test("Converts an input_string to camelCase", () => {
        expect(camelCase("some_variable")).toBe("someVariable");

        expect(camelCase("a_variable")).toBe("aVariable");
    });

    test("Doesn't remove useful _ ", () => {
        expect(camelCase("_some_variable")).toBe("_someVariable");
    });
});
```

```javascript
const camelCase = str =>
    str.replace(/_[\w]/g, (match, index) =>
        index !== 0 ? match.toUpperCase().replace("_", "") : match
    );

module.exports = { camelCase };
```

## Happy Path

Now to the meat and potatoes of this post.

we want a function that given an object `{my_name: 'Waju'}` returns `{myName: 'Waju'}` or vice versa. let's start by testing the happy path

```javascript
const { convert } = require("../src/convert");

const { camelCase, snakeCase } = require("../src/utils");

describe("Converter", () => {
    test("given an object, proper response", () => {
        expect(
            convert(
                { my_name: "Waju", a_prop: { b_prop: "prop value" } },

                camelCase
            )
        ).toEqual({ myName: "Waju", aProp: { bProp: "prop value" } });

        expect(
            convert(
                {
                    myName: "Waju",

                    aProp: {
                        bProp: "prop value",

                        cProp: { dProp: "someProp", e_prop: null }
                    }
                },

                snakeCase
            )
        ).toEqual({
            my_name: "Waju",

            a_prop: {
                b_prop: "prop value",

                c_prop: { d_prop: "someProp", e_prop: null }
            }
        });

        expect(convert({ myName: "Waju" }, snakeCase)).toEqual({
            my_name: "Waju"
        });

        expect(convert({ name: "Waju" }, snakeCase)).toEqual({ name: "Waju" });
    });
});
```

_note that I have started importing `camelCase` and `snakeCase` from a utils module._

In solving many problems it is a good practice to break it down into steps in plain language

so the steps to convert the keys of an object to a different case.

-   Get each property

-   Change that property's key to the required case

-   Return the object

we will progressively refine this algorithm as we write more test cases to meet our specs. the main thing is to get it working.

```javascript
const convert = (obj, fn) => {
    let val = {};

    Object.entries(obj).forEach(([key, value]) => {
        val[fn(key)] = value;
    });

    return val;
};

module.exports = { convert };
```

This implementation works for what we would call a base case but as our tests will reveal it doesn't accommodate nested objects. also notice that I am not mutating our input object, rather we create a brand new Object. while changing case is an idempotent operation we still have to obey the most important rule of purity, &mdash; never mutate your inputs

-   If a property is an object, converts its keys

-   if it isn't, return it.

I have found that recursion is just about "delaying the work till the smallest and most maintainable piece of instruction.

To ensure we avoid the Stack overflow problem we would move the early return to the first step.

-   If it is not an object return it.

-   if it is, convert it

and our code works just like that. to keep this post short. I'd just post the final code with checks for `null` and `undefined` values

```javascript
const convert = (obj, fn) => {
    if (!obj || obj.constructor.name !== "Object") {
        return obj;
    }

    let val = {};

    Object.entries(obj).forEach(([key, value]) => {
        val[fn(key)] = convert(value, fn);
    });

    return val;
};
```

## Better

To make the `convert` function more useful, we may need to change it's API so we can take advantage of some pretty neat features of the Javascript language particularly [partial application](https://en.wikipedia.org/wiki/Partial_application). to do this we will need to move the data to the last position in the parameter list of our convert function

```javascript
	const convert = (fn, object) => ....
```

this allows us to have convert be a function that returns a function, that accepts an object and returns a converted object. so much recursion 😂
something like

```javascript
const convertTo = fn => obj => convert(obj, fn);
```

I have chosen to create a new function rather than change the API of our original function.
with this, we can write code like

```javascript
	const toSnake = convertTo(snakeCase)
	...
	const mySnakeifiedObject = toSnake(sourceObject)
```

Some other day I'd dig into Functional programming, at least what i now know on the subject.

## Use the force.

While this was an empowering exercise, I think in a production app, one would be better served by composing utilities from packages like [lodash](https://lodash.com) or [Ramda](ramdajs.com). This will improve our confidence in the code as these are battle-tested solutions, we will also need fewer tests.
