import { Project, ObjectLiteralExpression, CodeBlockWriter, JSDoc } from 'ts-morph';

const writeLiteral = (writer: CodeBlockWriter, description: string): CodeBlockWriter => {
	return writer.write('{description: ').quote(description).write('}');
}

const operateOnLiteral = (node: ObjectLiteralExpression, description: string, override: boolean): void => {
	if (!node.getProperty('description')) {
		node.addPropertyAssignment({
			name: 'description',
			initializer: writer => writer.quote(description),
		});
	} else if (override) {
		node.getProperty('description').remove();
		node.addPropertyAssignment({
			name: 'description',
			initializer: writer => writer.quote(description),
		});
	}
};

module.exports = function(source: string): string {
	this.cacheable();

	/* File null won't be created since .save() is never called */
	const project = new Project()
	const sourceFile = project.createSourceFile('null', source)

	/* Should be configurable in Webpack config */
	const OverrideDescription = true;
  
	const classes = sourceFile.getClasses();
	if (!classes) return sourceFile.getFullText();
	classes.forEach(targetClass => {
		/* Since Methods and Properties share the relevant / used methods, can use `as any` to ignore warnings */
		const properties = targetClass.getMethods().concat(targetClass.getProperties() as any);
		if (!properties) return sourceFile.getFullText();
		properties.forEach(targetProperty => {
			const docs = targetProperty.getJsDocs();
			const decorators = targetProperty.getDecorators();

			if (!docs) return sourceFile.getFullText();
			const description = docs.reduce<string>((acc: string, currentDoc: JSDoc): string => {
				let currentComment = '';
				currentDoc.getTags().forEach(tag => {
					if (tag.getTagName() === 'typegraphql') {
						currentComment = tag.getComment();
					}
				})
				return `${acc}${currentComment}\n`;
			}, '');

			if (!decorators || !description) return sourceFile.getFullText();
			decorators.forEach(decoratorFull => {

				const decoratorCore = decoratorFull.getChildAtIndex(1);
				const decoratorParts = decoratorCore.getChildren();

				if (decoratorParts.slice(1, 4).map(node => node.getText()).join('') === '()') {
				/* Create object literal if the decorator is empty */
					
					decoratorParts[2].replaceWithText(writer => writeLiteral(writer, description));
				} else {
				/* Add the description property if the decorator isn't empty */

					const decoratorContent = decoratorCore.getChildAtIndexIfKindOrThrow(2, 323);
					const childrenCount = decoratorContent.getChildCount();

					if (childrenCount === 1 && !decoratorContent.getChildAtIndexIfKind(0, 193)) {
					/* Append comma seperator and then object literal */
						decoratorContent.addChildText([',', writer => writeLiteral(writer, description)]);
					} else if (childrenCount === 1) {
					/* The object literal is the first argument, so modify it */
						operateOnLiteral(decoratorContent.getChildAtIndexIfKind(0, 193), description, OverrideDescription)
					} else if (childrenCount === 3) {
					/* The object literal is the third argument, so modify it */
						operateOnLiteral(decoratorContent.getChildAtIndexIfKindOrThrow(2, 193), description, OverrideDescription)
					}
				}
			});

		})
	})
	return sourceFile.getFullText();
};