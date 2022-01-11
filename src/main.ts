// TODO:
// https://github.com/cibernox/precompile-intl-runtime/blob/master/src/index.ts

import * as O from "fp-ts/Option";
import * as A from "fp-ts/Array";
import * as icuMessageformatParser from "@formatjs/icu-messageformat-parser";

import * as ts from "typescript";
import { pipe } from "fp-ts/lib/function";

type Param = {
    name: string;
    type: ts.KeywordTypeNode<ts.KeywordTypeSyntaxKind>;
};

const createParamsType = (
    icuAST: icuMessageformatParser.MessageFormatElement[]
): ts.TypeLiteralNode => {
    const params = pipe(
        icuAST,
        A.filterMap((node): O.Option<Param> => {
            switch (node.type) {
                case icuMessageformatParser.TYPE.argument: {
                    const name = node.value;
                    const type = ts.factory.createKeywordTypeNode(
                        ts.SyntaxKind.StringKeyword
                    );
                    return O.some({ name, type });
                }
                case icuMessageformatParser.TYPE.number: {
                    const name = node.value;
                    const type = ts.factory.createKeywordTypeNode(
                        ts.SyntaxKind.NumberKeyword
                    );
                    return O.some({ name, type });
                }
                default:
                    // TODO:
                    return O.none;
            }
        })
    );

    const paramsObject = ts.factory.createTypeLiteralNode(
        params.map((param) => {
            return ts.factory.createPropertySignature(
                undefined,
                ts.factory.createIdentifier(param.name),
                undefined,
                param.type
            );
        })
    );

    return paramsObject;
};

const createDestructuredParams = (
    icuAST: icuMessageformatParser.MessageFormatElement[]
): ts.BindingName => {
    const params = icuAST
        .map((node) => {
            switch (node.type) {
                case icuMessageformatParser.TYPE.argument:
                    return [node.value];
                case icuMessageformatParser.TYPE.number:
                    return [node.value];
                default:
                    return [];
            }
        })
        .flat();
    return ts.factory.createObjectBindingPattern(
        params.map((param) =>
            ts.factory.createBindingElement(
                undefined,
                undefined,
                ts.factory.createIdentifier(param),
                undefined
            )
        )
    );
};

// TODO: return string if no params
const createBody = (
    icuAST: icuMessageformatParser.MessageFormatElement[]
): ts.TemplateExpression => {
    // TODO: derive result from AST
    return ts.factory.createTemplateExpression(
        ts.factory.createTemplateHead("Hello ", "Hello "),
        [
            ts.factory.createTemplateSpan(
                ts.factory.createIdentifier("name"),
                ts.factory.createTemplateMiddle(". You are ", ". You are ")
            ),
            ts.factory.createTemplateSpan(
                ts.factory.createIdentifier("years"),
                ts.factory.createTemplateTail(" old.", " old.")
            ),
        ]
    );
};

const printer = ts.createPrinter({
    newLine: ts.NewLineKind.LineFeed,
    removeComments: false,
    omitTrailingSemicolon: true,
});

const sourceFile = ts.createSourceFile(
    "someFileName.ts",
    "",
    ts.ScriptTarget.ESNext,
    false,
    ts.ScriptKind.TS
);

const icuAST = icuMessageformatParser.parse(
    "Hello, {name}. You are {years, number} years old."
);

const tsAST = ts.factory.createArrowFunction(
    undefined,
    undefined,
    [
        ts.factory.createParameterDeclaration(
            undefined,
            undefined,
            undefined,
            createDestructuredParams(icuAST),
            undefined,
            createParamsType(icuAST)
        ),
    ],
    undefined,
    undefined,
    createBody(icuAST)
);

const s = printer.printNode(ts.EmitHint.Expression, tsAST, sourceFile);

console.log(s);
