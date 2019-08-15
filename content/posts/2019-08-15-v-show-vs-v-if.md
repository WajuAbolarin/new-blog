---
title: "V-show or v-if"

slug: "v-show-or-v-if"

description: ""

date: 2019-08-15 02:08:04

author: "Waju"

tags: ["javascript", "VueJs", "opinion"]

cover: "/images/posts/lifecycle.png"

fullscreen: false
---

## Introduction

Vue Js framework offers a few handy directives, in particular, there are two that seemingly amend themselves to the same end when you need to conditionally render an item, `v-show` and `v-if`. Devs often use them interchangeably presuming that they are largely the same. but I just had to investigate the difference and when one might be the **correct** choice in a particular use case. I find that such clear knowledge will save me the headache resulting from some class of bugs that are not so obvious.

## TL;DR

In case you aren't interested in my long-winded rambling, here the gist of it all.

-   prefer v-show if you need to toggle something very often, and prefer v-if if the condition is unlikely to change at runtime.

-   Use v-if when you wanna render something after a network request succeeds.

-   Use v-if if you will be accessing nested object properties that may not be available at render time.

-   Use v-show when you need to hook up a library to the raw DOM node, it's always in the DOM.

If you are still reading then you like me you probably wanna know _why_

## Syntax

-   `v-if` if supports conditionally rendering a group, which allows you to render a group conditionally by applying the condition once on a wrapping `template` tag without manually adding the directive to each item. think navigation items that are only rendered on some conditions (login state, or user role). this allows you to have your cake and eat it without adding an extra `div`

*   `v-if` can be followed by a `v-else` (and maybe a `v-else-if` if you are that kinda person 😒), however, you may wanna avoid this as it introduces an unnecessary cognitive load of calculating the negation of your condition, especially for long blocks. if that word feels stressful … 😒

## On to the good stuff

According to the excellent docs.

> The directive v-if is used to conditionally render a block. The block will only be rendered if the directive’s expression returns a truthy value.

and for the `v-show` directive it reads

> Another option for conditionally displaying an element is the v-show directive. The usage is largely the same:

## Rendering vs Displaying

You may have caught on that the docs carefully use the words **render** for `v-if` and `display` for `v-show` hence `v-if` is suitable for when you want to render or not render an item\*, while `v-show` is suitable for when you just wanna hide something visually but it is present on the screen. this leads to the first item on the TL;DR list

## Performance.

UI frameworks like Vue offer a layer of abstraction over the DOM providing use a clean, robust and consistent API for controlling UI, one critical part of a framework's task is to put nodes in the DOM in a performant way and update those nodes to match data (state) as well as destroy them when they are no longer needed. this can is often referred to as rendering ( and re-rendering). For now, the most important thing to know is that rendering is an expensive operation because it has to do with touching the DOM which is inherently slow though Vue optimizes this by employing a Virtual DOM and some other tricks. more big words. but this is not a treatise on Vue Js' architecture. It would be fun to do that someday but I digress.

Take this piece of code for example where we define a `Test comp` , in a real app we would probably be setting up event listeners, subscribing to Vuex stores, WebSocket subscriptions, graphql and whatever kind of voodoo you're into, no judgment. A real component would probably also have some other component as children. each with their mess of listeners and hooks, Here we just hook into the different phases of the components' lifecycle, for good measure, we register a click event listener, that Vue has to deal with somehow.

```javascript



<template>



<h4  @click="noop">I  am  conditionally  rendered</h4>



</template>



<script>



export  default  {



beforeCreate() {



console.log('beforeCreate')



},



created() {



console.log('Created')



},



beforeMount() {



console.log('before mounting')



},



mounted() {



console.log('Mounted')



},





beforeUpdate() {



console.log('before update')



},



updated() {



console.log('updated')



},





beforeDestroy() {



console.log('before destroy')



},



destroyed() {



console.log('destroyed')



},



methods:  {



noop()  {}



}



}



</script>



```

In the `App` component we have the `TestComp` as a child component.

```javascript

<template>

<div  id="app">

<h3>V-if vs v-show</h3>

<TestComponent  v-show="showStuff"  />

<button  @click="showStuff  =  !showStuff">Toggle  Stuff</button>

</div>



</template>





<script>



import  TestComponent  from  '@/components/TestComp'



export  default  {



name: 'app',



components: {



TestComponent



},



data: ()  => ({



showStuff:  false



})



}



</script>



```

When Vue renders this component let say it would incur a performance cost x units for rendering the node that corresponds to the `TestComp`. with v-if, since the condition is initially false, the component is not rendered at all there will be no console logs, which is good for performance. no wasteful operation(s). had we used `v-show` we would have `TestComp` rendered only just to be hidden with `style=" display :none"` Hence the docs says

> v-if is “real” conditional rendering because it ensures that event listeners and child components inside the conditional block are properly destroyed and re-created during toggles.

v-if is also lazy: if the condition is false on initial render, it will not do anything - the conditional block won’t be rendered until the condition becomes true for the first time. In comparison, v-show is much simpler - the element is always rendered regardless of the initial condition, with CSS-based toggling.

And this leads to their conclusion

> Generally speaking, v-if has higher toggle costs while v-show has higher initial render costs.

> So prefer v-show if you need to toggle something very often, and prefer v-if if the condition is unlikely to change at runtime.

## Network Requests

Consider this piece of code where we show an item fetched over the network.

```javascript



<template>



<div  id="app">



<h3>V-if vs v-show </h3>



<Todo  v-show="todo"  v-bind="todo"  />



</div>



</template>



<script>



import Todo from '@/components/Todo'



export default {



name: 'app',



components: {



Todo



},



data: ()  => ({



todo:  null



}),





created() {



this.fetchData()



},



methods: {



async  fetchData()  {



const  res  =  await  fetch('https://jsonplaceholder.typicode.com/todos/1')



const  todo  =  await  res.json()



this.todo  =  todo



}



}



}



</script>



```

```javascript



<template  >



<article>



<p>{{title}}</p>



<input  type="checkbox"  name="complete"  id="1"  :checked="completed"  />



</article>



</template>



<script>



export default {



name: 'Todo',



props: {



title:  String,



completed:  Boolean,



id:  Number



},



updated() {



console.log('UPDATED TODO', { ...this.$props  })



},



mounted() {



console.log('MOUNTED TODO',  {  ...this.$props  })



}



}



</script>



```

no matter how fast, (or slow 😒) the network is there is a space of time when the request is not completed and our todo is still null, With `v-show`, Vue Js would have to touch the DOM twice -once to mount the Todo component with null, and again when the request succeeded and the value of `todo` changes, phew 😢 with `v-if` on the other hand Vue will only render it when the `todo` (according to our condition) holds a value, (of course if we had set `todo` to `{}` initially, we would have ended up with a situation where they both have the same effect. don't do that

![console logs with v-show](/images/post/v-show-network.jpg)

## Nested Properties

let's adjust some parts of our code.

```javascript



<template>



…



<span  >By {{todo.author.name}}</span>



</template>





<script>



import Todo from '@/components/Todo'



export default {



…



methods: {



async  fetchData()  {



const  res  =  await  fetch('https://jsonplaceholder.typicode.com/todos/1')



const  todo  =  await  res.json()



this.todo  =  {  ...todo,  ...{ author:  { name:  'Waju'  }  }  }



}



}



}



</script>



```

As this has turned into a rather lengthy one, I'd rant more on this in another post in a few days.
