# TypeGraphQL Description Loader

[![npm version](https://badge.fury.io/js/typegraphql-description-loader.svg)](https://badge.fury.io/js/typegraphql-description-loader)

Webpack loader that takes @typegraphql JSDoc comments and inserts the contents into the decorator (description property in options). TypeGraphQL then takes this comment and applies it to the schema it generates. This functionality will possibly be included in the TypeGraphQL reflection plugin, however there is no ETA for this.

This package allows you to comment your code and your GraphQL schema all in one, without duplicating code or missing either out. It is also eye-friendly, in comparison to multi-line strings in Javascript which would require escaping the newline characters. Particularly helpful in resolvers that have lots of methods & require (relatively) long descriptions, which can quickly get messy.

When you use the `@typegraphql` tag in a JSDoc comment, this package will assume that the decorator associated with the comment actually supports the TypeGraphQL AdvancedOptions argument. This means custom decorators are supported, as long as the arguments follow the layout of the official decorators.

### Turn this:
```ts
import { Field, ID, Mutation, Arg, Resolver } from 'type-graphql';

@Resolver(of => Person)
class PersonResolver {

	/** ID of the person, sort of like a breathing barcode. */
	@Field(type => ID, { description: 'ID of the person, sort of like a breathing barcode.' })
	id: string;

	/** Name of the person, label used to identify them by humans. */
	@Field(type => String, { description: 'Name of the person, label used to identify them by humans.' })
	name: string;

	/** Update the person's name, usually an expensive legal process,
	 *  but here we use GraphQL mutations to do it quickly, and for no
	 *  expense.
	 */
	@Mutation(returns => Person, { complexity: 9, description: '\
Update the person\'s name, usually an expensive legal process, \
but here we use GraphQL mutations to do it quickly, and for no \
expense.'})
	updateName(@Arg('name') name: string): Person {
		const person = Persons.findByName(name);
		person.name = name;
		return person;
	}

}
```

### Into this:
```ts
import { Field, ID, Mutation, Arg, Resolver } from 'type-graphql';

@Resolver(of => Person)
class PersonResolver {

	/** @typegraphql ID of the person, sort of like a breathing barcode. */
	@Field(type => ID)
	id: string;

	/** @typegraphql Name of the person, label used to identify them by humans. */
	@Field(type => String)
	name: string;

	/** @typegraphql Update the person's name, usually an expensive legal process,
	 *  but here we use GraphQL mutations to do it quickly, and for no
	 *  expense.
	 */
	@Mutation(returns => Person, { complexity: 9 })
	updateName(@Arg('name') name: string): Person {
		const person = Persons.findByName(name);
		person.name = name;
		return person;
	}

}
```
### Installation
First setup the Webpack with the TypeScript and TypeGraphQL project you are working on.
Then install this package:
```shell
$> npm install typegraphql-description-loader --save-dev
```
Next, use the loader in your Webpack configuration file. TypeGraphQL Description Loader needs to be loaded first, before ts-loader (loaders are used in reverse order).
```js
module.exports = {
  ...
  module: {
      rules: [
          {
              test: /\.ts$/,
              use: ['ts-loader', 'typegraphql-description-loader'],
              exclude: /node_modules/,
          }
      ]
  },
  ...
};
```
### To Do:
Currently only class property/method decorators are supported by this package, such as `Field`, `Query`, and `Mutation`. I will add support for class declarations themselves soon.

Please know that this package was put together quickly for use by me, the code is beyond messy.
