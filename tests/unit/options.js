/**
 * Tests for all non-environmental options. Non-environmental options are
 * options that change how JSHint behaves instead of just pre-defining a set
 * of global variables.
 */

"use strict";

var fs = require('fs');
var jshint  = require('../../src/jshint.js');
var TestRun = require('../helpers/testhelper').setup.testRun;
var fixture = require('../helpers/fixture').fixture;

/**
 * Option `shadow` allows you to re-define variables later in code.
 *
 * E.g.:
 *	 var a = 1;
 *	 if (cond == true)
 *		 var a = 2; // Variable a has been already defined on line 1.
 *
 * More often than not it is a typo, but sometimes people use it.
 */
exports.shadow = function (test) {
	var src = fs.readFileSync(__dirname + "/fixtures/redef.js", "utf8");

	// Do not tolerate variable shadowing by default
	TestRun(test)
		.addError(5, "'a' is already defined.")
		.addError(10, "'foo' is already defined.")
		.test(src, {es3: true});

	// Allow variable shadowing when shadow is true
	TestRun(test)
		.test(src, { es3: true, shadow: true });

	test.done();
};

/**
 * Option `latedef` allows you to prohibit the use of variable before their
 * definitions.
 *
 * E.g.:
 *	 fn(); // fn will be defined later in code
 *	 function fn() {};
 *
 * Since JavaScript has function-scope only, you can define variables and
 * functions wherever you want. But if you want to be more strict, use
 * this option.
 */
exports.latedef = function (test) {
	var src  = fs.readFileSync(__dirname + '/fixtures/latedef.js', 'utf8'),
		src1 = fs.readFileSync(__dirname + '/fixtures/redef.js', 'utf8');

	// By default, tolerate the use of variable before its definition
	TestRun(test)
		.test(src, {es3: true});

	// However, JSHint must complain if variable is actually missing
	TestRun(test)
		.addError(1, "'fn' is not defined.")
		.test('fn();', { es3: true, undef: true });

	// And it also must complain about the redefinition (see option `shadow`)
	TestRun(test)
		.addError(5, "'a' is already defined.")
		.addError(10, "'foo' is already defined.")
		.test(src1, { es3: true });

	// When latedef is true, JSHint must not tolerate the use before definition
	TestRun(test)
		.addError(10, "'vr' was used before it was defined.")
		.test(src, { es3: true, latedef: "nofunc" });

	// When latedef_func is true, JSHint must not tolerate the use before definition for functions
	TestRun(test)
		.addError(2, "'fn' was used before it was defined.")
		.addError(6, "'fn1' was used before it was defined.")
		.addError(10, "'vr' was used before it was defined.")
		.addError(18, "Inner functions should be listed at the top of the outer function.")
		.test(src, { es3: true, latedef: true });

	test.done();
};

exports.notypeof = function (test) {
	var src = fs.readFileSync(__dirname + '/fixtures/typeofcomp.js', 'utf8');

	TestRun(test)
		.addError(1, "Invalid typeof value 'funtion'")
		.addError(2, "Invalid typeof value 'double'")
		.addError(3, "Invalid typeof value 'bool'")
		.addError(4, "Invalid typeof value 'obj'")
		.test(src);

	TestRun(test)
		.test(src, { notypeof: true });

	test.done();
}

exports['combination of latedef and undef'] = function (test) {
	var src = fixture('latedefundef.js');

	// Assures that when `undef` is set to true, it'll report undefined variables
	// and late definitions won't be reported as `latedef` is set to false.
	TestRun(test)
		.addError(29, "'hello' is not defined.")
		.addError(35, "'world' is not defined.")
		.test(src, { es3: true, latedef: false, undef: true });

	// When we suppress `latedef` and `undef` then we get no warnings.
	TestRun(test)
		.test(src, { es3: true, latedef: false, undef: false });

	// If we warn on `latedef` but supress `undef` we only get the
	// late definition warnings.
	TestRun(test)
		.addError(5, "'func2' was used before it was defined.")
		.addError(12, "'foo' was used before it was defined.")
		.addError(18, "'fn1' was used before it was defined.")
		.addError(26, "'baz' was used before it was defined.")
		.addError(34, "'fn' was used before it was defined.")
		.addError(41, "'q' was used before it was defined.")
		.addError(46, "'h' was used before it was defined.")
		.test(src, { es3: true, latedef: true, undef: false });

	// But we get all the functions warning if we disable latedef func
	TestRun(test)
		.addError(41, "'q' was used before it was defined.")
		.addError(46, "'h' was used before it was defined.")
		.test(src, { es3: true, latedef: "nofunc", undef: false });

	// If we warn on both options we get all the warnings.
	TestRun(test)
		.addError(5, "'func2' was used before it was defined.")
		.addError(12, "'foo' was used before it was defined.")
		.addError(18, "'fn1' was used before it was defined.")
		.addError(26, "'baz' was used before it was defined.")
		.addError(29, "'hello' is not defined.")
		.addError(34, "'fn' was used before it was defined.")
		.addError(35, "'world' is not defined.")
		.addError(41, "'q' was used before it was defined.")
		.addError(46, "'h' was used before it was defined.")
		.test(src, { es3: true, latedef: true, undef: true });

	// If we remove latedef_func, we don't get the functions warning
	TestRun(test)
		.addError(29, "'hello' is not defined.")
		.addError(35, "'world' is not defined.")
		.addError(41, "'q' was used before it was defined.")
		.addError(46, "'h' was used before it was defined.")
		.test(src, { es3: true, latedef: "nofunc", undef: true });

	test.done();
};

exports.undefwstrict = function (test) {
	var src = fs.readFileSync(__dirname + '/fixtures/undefstrict.js', 'utf8');
	TestRun(test).test(src, { es3: true, undef: false });

	test.done();
};

// Regression test for GH-431
exports["implied and unused should respect hoisting"] = function (test) {
	var src = fs.readFileSync(__dirname + '/fixtures/gh431.js', 'utf8');
	TestRun(test)
		.addError(14, "'fun4' is not defined.")
		.test(src, { undef: true }); // es5

	var report = jshint.run(src, { undef: true }).data;

	test.equal(report.implieds.length, 1);
	test.equal(report.implieds[0].name, 'fun4');
	test.deepEqual(report.implieds[0].line, [14]);

	test.equal(report.unused.length, 3);

	test.done();
};

/**
 * The `proto` and `iterator` options allow you to prohibit the use of the
 * special `__proto__` and `__iterator__` properties, respectively.
 */
exports.testProtoAndIterator = function (test) {
	var source = fs.readFileSync(__dirname + '/fixtures/protoiterator.js', 'utf8');

	// JSHint should not allow the `__proto__` and
	// `__iterator__` properties by default
	TestRun(test)
		.addError(7, "The '__proto__' property is deprecated.")
		.addError(8, "The '__proto__' property is deprecated.")
		.addError(10, "The '__proto__' property is deprecated.")
		.addError(27, "'__iterator__' is only available in JavaScript 1.7.")
		.addError(33, "The '__proto__' property is deprecated.")
		.addError(37, "The '__proto__' property is deprecated.")
		.test(source, {es3: true});

	// Should not report any errors when proto and iterator
	// options are on
	TestRun(test)
		.test(source, { es3: true, proto: true, iterator: true });

	test.done();
};

/**
 * Option `curly` allows you to enforce the use of curly braces around
 * control blocks. JavaScript allows one-line blocks to go without curly
 * braces but some people like to always use curly bracse. This option is
 * for them.
 *
 * E.g.:
 *	 if (cond) return;
 *	   vs.
 *	 if (cond) { return; }
 */
exports.curly = function (test) {
	var src  = fs.readFileSync(__dirname + '/fixtures/curly.js', 'utf8'),
		src1 = fs.readFileSync(__dirname + '/fixtures/curly2.js', 'utf8');

	// By default, tolerate one-line blocks since they are valid JavaScript
	TestRun(test).test(src, {es3: true});
	TestRun(test).test(src1, {es3: true});

	// Require all blocks to be wrapped with curly braces if curly is true
	TestRun(test)
		.addError(2, "Expected '{' and instead saw 'return'.")
		.addError(5, "Expected '{' and instead saw 'doSomething'.")
		.addError(8, "Expected '{' and instead saw 'doSomething'.")
		.addError(11, "Expected '{' and instead saw 'doSomething'.")
		.test(src, { es3: true, curly: true });

	TestRun(test).test(src1, { es3: true, curly: true });

	test.done();
};

/**
 * Option `noarg` prohibits the use of arguments.callee and arguments.caller.
 * JSHint allows them by default but you have to know what you are doing since:
 *	- They are not supported by all JavaScript implementations
 *	- They might prevent an interpreter from doing some optimization tricks
 *	- They are prohibited in the strict mode
 */
exports.noarg = function (test) {
	var src = fs.readFileSync(__dirname + '/fixtures/noarg.js', 'utf8');

	// By default, tolerate both arguments.callee and arguments.caller
	TestRun(test).test(src, { es3: true });

	// Do not tolerate both .callee and .caller when noarg is true
	TestRun(test)
		.addError(2, 'Avoid arguments.callee.')
		.addError(6, 'Avoid arguments.caller.')
		.test(src, { es3: true, noarg: true });

	test.done();
};

/** Option `nonew` prohibits the use of constructors for side-effects */
exports.nonew = function (test) {
	var code  = "new Thing();",
		code1 = "var obj = new Thing();";

	TestRun(test).test(code, { es3: true });
	TestRun(test).test(code1, { es3: true });

	TestRun(test)
		.addError(1, "Do not use 'new' for side effects.", { ch: 1 })
		.test(code, { es3: true, nonew: true });

	test.done();
};

exports.shelljs = function (test) {
	var src = fs.readFileSync(__dirname + '/fixtures/shelljs.js', 'utf8');

	TestRun(test, 1)
		.addError(1, "'target' is not defined.")
		.addError(3, "'echo' is not defined.")
		.addError(4, "'exit' is not defined.")
		.addError(5, "'cd' is not defined.")
		.addError(6, "'pwd' is not defined.")
		.addError(7, "'ls' is not defined.")
		.addError(8, "'find' is not defined.")
		.addError(9, "'cp' is not defined.")
		.addError(10, "'rm' is not defined.")
		.addError(11, "'mv' is not defined.")
		.addError(12, "'mkdir' is not defined.")
		.addError(13, "'test' is not defined.")
		.addError(14, "'cat' is not defined.")
		.addError(15, "'sed' is not defined.")
		.addError(16, "'grep' is not defined.")
		.addError(17, "'which' is not defined.")
		.addError(18, "'dirs' is not defined.")
		.addError(19, "'pushd' is not defined.")
		.addError(20, "'popd' is not defined.")
		.addError(21, "'env' is not defined.")
		.addError(22, "'exec' is not defined.")
		.addError(23, "'chmod' is not defined.")
		.addError(24, "'config' is not defined.")
		.addError(25, "'error' is not defined.")
		.addError(26, "'tempdir' is not defined.")
		.addError(29, "'require' is not defined.")
		.addError(30, "'module' is not defined.")
		.addError(31, "'process' is not defined.")
		.test(src, { undef: true });

	TestRun(test, 2)
		.test(src, { undef: true, shelljs: true });

	test.done();
};

// Option `asi` allows you to use automatic-semicolon insertion
exports.asi = function (test) {
	var src = fs.readFileSync(__dirname + '/fixtures/asi.js', 'utf8');

	TestRun(test, 1)
		.addError(2, "Missing semicolon.")
		.addError(4, "Missing semicolon.")
		.addError(5, "Missing semicolon.")
		.addError(9, "Missing semicolon.")
		.addError(10, "Missing semicolon.")
		.addError(11, "Missing semicolon.")
		.addError(12, "Missing semicolon.")
		.addError(16, "Missing semicolon.")
		.addError(17, "Missing semicolon.")
		.addError(19, "Missing semicolon.")
		.addError(21, "Missing semicolon.")
		.addError(25, "Missing semicolon.")
		.addError(26, "Missing semicolon.", { ch: 10 })
		.addError(27, "Missing semicolon.", { ch: 12 })
		.addError(28, "Missing semicolon.", { ch: 12 })
		.test(src, { es3: true });

	TestRun(test, 2)
		.addError(2, "Missing semicolon.") // throw on "use strict", even option asi is used
		.test(src, { es3: true, asi: true });

	test.done();
};

/** Option `lastsemic` allows you to skip the semicolon after last statement in a block,
  * if that statement is followed by the closing brace on the same line. */
exports.lastsemic = function (test) {
	var src = fs.readFileSync(__dirname + '/fixtures/lastsemic.js', 'utf8');

	// without lastsemic
	TestRun(test)
		.addError(2, "Missing semicolon.") // missing semicolon in the middle of a block
		.addError(4, "Missing semicolon.") // missing semicolon in a one-liner function
		.addError(5, "Missing semicolon.") // missing semicolon at the end of a block
		.test(src, {es3: true});

	// with lastsemic
	TestRun(test)
		.addError(2, "Missing semicolon.")
		.addError(5, "Missing semicolon.")
		.test(src, { es3: true, lastsemic: true });
	// this line is valid now: [1, 2, 3].forEach(function(i) { print(i) });
	// line 5 isn't, because the block doesn't close on the same line

	// it shouldn't interfere with asi option
	TestRun(test).test(src, { es3: true, lastsemic: true, asi: true });

	test.done();
};

/**
 * Option `expr` allows you to use ExpressionStatement as a Program code.
 *
 * Even though ExpressionStatement as a Program (i.e. without assingment
 * of its result) is a valid JavaScript, more often than not it is a typo.
 * That's why by default JSHint complains about it. But if you know what
 * are you doing, there is nothing wrong with it.
 */
exports.expr = function (test) {
	var exps = [
		"obj && obj.method && obj.method();",
		"myvar && func(myvar);",
		"1;",
		"true;",
		"+function (test) {};"
	];

	for (var i = 0, exp; exp = exps[i]; i += 1) {
		TestRun(test)
			.addError(1, 'Expected an assignment or function call and instead saw an expression.')
			.test(exp, { es3: true });
	}

	for (i = 0, exp = null; exp = exps[i]; i += 1) {
		TestRun(test).test(exp, { es3: true, expr: true });
	}

	test.done();
};

// Option `undef` requires you to always define variables you use.
exports.undef = function (test) {
	var src = fs.readFileSync(__dirname + '/fixtures/undef.js', 'utf8');

	// Make sure there are no other errors
	TestRun(test).test(src, { es3: true });

	// Make sure it fails when undef is true
	TestRun(test)
		.addError(1, "'undef' is not defined.")
		.addError(5, "'undef' is not defined.")
		.addError(6, "'undef' is not defined.")
		.addError(8, "'undef' is not defined.")
		.addError(9, "'undef' is not defined.")
		.addError(13, "'localUndef' is not defined.")
		.addError(18, "'localUndef' is not defined.")
		.addError(19, "'localUndef' is not defined.")
		.addError(21, "'localUndef' is not defined.")
		.addError(22, "'localUndef' is not defined.")
		.test(src, { es3: true, undef: true });

	// Regression test for GH-668.
	src = fs.readFileSync(__dirname + "/fixtures/gh668.js", "utf8");

	var rep = jshint.run(src, { undef: true });
	test.ok(rep.success);
	test.ok(!rep.data.implieds);

	rep = jshint.run(src);
	test.ok(rep.success);
	test.ok(!rep.data.implieds);

	test.done();
};

exports.unused = function (test) {
	var src = fs.readFileSync(__dirname + '/fixtures/unused.js', 'utf8');

	TestRun(test).test(src, { es3: true });

	var var_errors = [
		[1, "'a' is defined but never used."],
		[7, "'c' is defined but never used."],
		[15, "'foo' is defined but never used."],
		[20, "'bar' is defined but never used."],
		[22, "'i' is defined but never used."]
	];

	var last_param_errors = [
		[6, "'f' is defined but never used."],
		[22, "'i' is defined but never used."],
		[28, "'a' is defined but never used."],
		[28, "'b' is defined but never used."],
		[28, "'c' is defined but never used."]
	];

	var all_param_errors = [
		[15, "'err' is defined but never used."],
		[22, "'i' is defined but never used."],
		[28, "'a' is defined but never used."],
		[28, "'b' is defined but never used."],
		[28, "'c' is defined but never used."]
	];

	var true_run = TestRun(test, {es3: true});

	var_errors.concat(last_param_errors).forEach(function (e) {
		true_run.addError.apply(true_run, e);
	});

	true_run.test(src, { unused: true });
	test.ok(!jshint.run(src, { es3: true, unused: true }).success);

	// Test checking all function params via unused="strict"
	var all_run = TestRun(test);
	var_errors.concat(last_param_errors, all_param_errors).forEach(function (e) {
		all_run.addError.apply(true_run, e);
	});

	all_run.test(src, { es3: true, unused: "strict"});

	// Test checking everything except function params
	var vars_run = TestRun(test);
	var_errors.forEach(function (e) { vars_run.addError.apply(vars_run, e); });
	vars_run.test(src, { unused: "vars"});

	var unused = jshint.run(src, { unused: "vars" }).data.unused;
	test.equal(10, unused.length);
	test.ok(unused.some(function (err) { return err.line === 1 && err.name === "a"; }));
	test.ok(unused.some(function (err) { return err.line === 6 && err.name === "f"; }));
	test.ok(unused.some(function (err) { return err.line === 7 && err.name === "c"; }));
	test.ok(unused.some(function (err) { return err.line === 15 && err.name === "foo"; }));

	test.done();
};

// Regressions for "unused" getting overwritten via comment (GH-778)
exports['unused overrides'] = function (test) {
	var code;

	code = ['function foo(a) {', '/*jshint unused:false */', '}', 'foo();'];
	TestRun(test).test(code, {es3: true, unused: true});

	code = ['function foo(a, b, c) {', '/*jshint unused:vars */', 'var i = b;', '}', 'foo();'];
	TestRun(test)
		.addError(3, "'i' is defined but never used.")
		.test(code, {es3: true, unused: true});

	code = ['function foo(a, b, c) {', '/*jshint unused:true */', 'var i = b;', '}', 'foo();'];
	TestRun(test)
		.addError(1, "'c' is defined but never used.")
		.addError(3, "'i' is defined but never used.")
		.test(code, {es3: true, unused: "strict"});

	code = ['function foo(a, b, c) {', '/*jshint unused:strict */', 'var i = b;', '}', 'foo();'];
	TestRun(test)
		.addError(1, "'a' is defined but never used.")
		.addError(1, "'c' is defined but never used.")
		.addError(3, "'i' is defined but never used.")
		.test(code, {es3: true, unused: true});

	code = ['/*jshint unused:vars */', 'function foo(a, b) {}', 'foo();'];
	TestRun(test).test(code, {es3: true, unused: "strict"});

	code = ['/*jshint unused:vars */', 'function foo(a, b) {', 'var i = 3;', '}', 'foo();'];
	TestRun(test)
		.addError(3, "'i' is defined but never used.")
		.test(code, {es3: true, unused: "strict"});

	test.done();
};

// Regression test for `undef` to make sure that ...
exports['undef in a function scope'] = function (test) {
	var src = fixture('undef_func.js');

	// Make sure that the lint is clean with and without undef.
	TestRun(test).test(src, {es3: true});
	TestRun(test).test(src, {es3: true, undef: true });

	test.done();
};

/** Option `scripturl` allows the use of javascript-type URLs */
exports.scripturl = function (test) {
	var code = [
			"var foo = { 'count': 12, 'href': 'javascript:' };",
			"foo = 'javascript:' + 'xyz';"
		],
		src = fs.readFileSync(__dirname + '/fixtures/scripturl.js', 'utf8');

	// Make sure there is an error
	TestRun(test)
		.addError(1, "Script URL.")
		.addError(2, "Script URL.") // 2 times?
		.addError(2, "JavaScript URL.")
		.test(code, {es3: true});

	// Make sure the error goes away when javascript URLs are tolerated
	TestRun(test).test(code, { es3: true, scripturl: true });

	// Make sure an error does not exist for labels that look like URLs (GH-1013)
	TestRun(test)
		.test(src, {es3: true});

	test.done();
};

/**
 * Option `forin` disallows the use of for in loops without hasOwnProperty.
 *
 * The for in statement is used to loop through the names of properties
 * of an object, including those inherited through the prototype chain.
 * The method hasOwnPropery is used to check if the property belongs to
 * an object or was inherited through the prototype chain.
 */
exports.forin = function (test) {
	var src = fs.readFileSync(__dirname + '/fixtures/forin.js', 'utf8');
	var msg = 'The body of a for in should be wrapped in an if statement to filter unwanted ' +
			  'properties from the prototype.';

	// Make sure there are no other errors
	TestRun(test).test(src, {es3: true});

	// Make sure it fails when forin is true
	TestRun(test)
		.addError(13, msg)
		.test(src, { es3: true, forin: true });

	test.done();
};

/**
 * Option `loopfunc` allows you to use function expression in the loop.
 * E.g.:
 *	 while (true) x = function (test) {};
 *
 * This is generally a bad idea since it is too easy to make a
 * closure-related mistake.
 */
exports.loopfunc = function (test) {
	var src = fs.readFileSync(__dirname + '/fixtures/loopfunc.js', 'utf8');

	// By default, not functions are allowed inside loops
	TestRun(test)
		.addError(2, "Don't make functions within a loop.")
		.addError(6, "Don't make functions within a loop.")
		.addError(10, "Function declarations should not be placed in blocks. Use a function " +
					  "expression or move the statement to the top of the outer function.")
		.test(src, {es3: true});

	// When loopfunc is true, only function declaration should fail.
	// Expressions are okay.
	TestRun(test)
		.addError(10, "Function declarations should not be placed in blocks. Use a function " +
					  "expression or move the statement to the top of the outer function.")
		.test(src, { es3: true, loopfunc: true });

	test.done();
};

/** Option `boss` unlocks some useful but unsafe features of JavaScript. */
exports.boss = function (test) {
	var src = fs.readFileSync(__dirname + '/fixtures/boss.js', 'utf8');

	// By default, warn about suspicious assignments
	TestRun(test)
		.addError(1, 'Expected a conditional expression and instead saw an assignment.')
		.addError(4, 'Expected a conditional expression and instead saw an assignment.')
		.addError(7, 'Expected a conditional expression and instead saw an assignment.')
		.addError(12, 'Expected a conditional expression and instead saw an assignment.')

		// GH-657
		.addError(14, 'Expected a conditional expression and instead saw an assignment.')
		.addError(17, 'Expected a conditional expression and instead saw an assignment.')
		.addError(20, 'Expected a conditional expression and instead saw an assignment.')
		.addError(25, 'Expected a conditional expression and instead saw an assignment.')

		// GH-670
		.addError(28, "Did you mean to return a conditional instead of an assignment?")
		.addError(32, "Did you mean to return a conditional instead of an assignment?")
		.test(src, {es3: true});

	// But if you are the boss, all is good
	TestRun(test).test(src, { es3: true, boss: true });

	test.done();
};

/**
 * Options `eqnull` allows you to use '== null' comparisons.
 * It is useful when you want to check if value is null _or_ undefined.
 */
exports.eqnull = function (test) {
	var code = [
		'if (e == null) doSomething();',
		'if (null == e) doSomething();',
		'if (e != null) doSomething();',
		'if (null != e) doSomething();',
	];

	// By default, warn about `== null` comparison
	TestRun(test)
		.addError(1, "Use '===' to compare with 'null'.")
		.addError(2, "Use '===' to compare with 'null'.")
		.addError(3, "Use '!==' to compare with 'null'.")
		.addError(4, "Use '!==' to compare with 'null'.")
		.test(code, {es3: true});

	// But when `eqnull` is true, no questions asked
	TestRun(test).test(code, { es3: true, eqnull: true });

	// Make sure that `eqnull` has precedence over `eqeqeq`
	TestRun(test).test(code, { es3: true, eqeqeq: true, eqnull: true });

	test.done();
};

/**
 * Option `supernew` allows you to use operator `new` with anonymous functions
 * and objects without invocation.
 *
 * Ex.:
 *	 new function (test) { ... };
 *	 new Date;
 */
exports.supernew = function (test) {
	var src = fs.readFileSync(__dirname + '/fixtures/supernew.js', 'utf8');

	TestRun(test)
		.addError(1, "Weird construction. Is 'new' necessary?")
		.addError(9, "Missing '()' invoking a constructor.", { ch: 1 })
		.addError(11, "Missing '()' invoking a constructor.", { ch: 13 })
		.test(src, {es3: true});

	TestRun(test).test(src, { es3: true, supernew: true });

	test.done();
};

/** Option `bitwise` disallows the use of bitwise operators. */
exports.bitwise = function (test) {
	var ops = [ '&', '|', '^', '<<', '>>', '>>>' ];
	var moreTests = [
		'var c = ~a;',
		'c &= 2;'
	];

	// By default allow bitwise operators
	for (var i = 0, op; op = ops[i]; i += 1) {
		TestRun(test).test('var c = a ' + op + ' b;', {es3: true});
	}
	TestRun(test).test(moreTests, {es3: true});

	for (i = 0, op = null; op = ops[i]; i += 1) {
		TestRun(test)
			.addError(1, "Unexpected use of '" + op + "'.")
			.test('var c = a ' + op + ' b;', { es3: true, bitwise: true });
	}
	TestRun(test)
		.addError(1, "Unexpected '~'.")
		.addError(2, "Unexpected use of '&='.")
		.test(moreTests, { es3: true, bitwise: true });

	test.done();
};

/** Option `debug` allows the use of debugger statements. */
exports.debug = function (test) {
	var code = 'function test () { debugger; return true; }';

	// By default disallow debugger statements.
	TestRun(test)
		.addError(1, "Forgotten 'debugger' statement?")
		.test(code, {es3: true});

	// But allow them if debug is true.
	TestRun(test).test(code, { es3: true, debug: true });

	test.done();
};

/** `debugger` statements without semicolons are found on the correct line */
exports.debug = function (test) {
  var src = [
    "function test () {",
    "debugger",
    "return true; }"
  ];

  // Ensure we mark the correct line when finding debugger statements
  TestRun(test)
    .addError(2, "Forgotten 'debugger' statement?")
    .test(src, {es3: true, asi: true});

  test.done();
};

/** Option `eqeqeq` requires you to use === all the time. */
exports.eqeqeq = function (test) {
	var src = fs.readFileSync(__dirname + '/fixtures/eqeqeq.js', 'utf8');

	TestRun(test)
		.addError(8, "Use '===' to compare with 'null'.")
		.test(src, {es3: true});

	TestRun(test)
		.addError(2, "Expected '===' and instead saw '=='.")
		.addError(5, "Expected '!==' and instead saw '!='.")
		.addError(8, "Expected '===' and instead saw '=='.")
		.test(src, { es3: true, eqeqeq: true });

	test.done();
};

/** Option `evil` allows the use of eval. */
exports.evil = function (test) {
	var src = [
		"eval('hey();');",
		"document.write('');",
		"document.writeln('');",
		"window.execScript('xyz');",
		"new Function('xyz();');",
		"setTimeout('xyz();', 2);",
		"setInterval('xyz();', 2);",
		"var t = document['eval']('xyz');"
	];

	TestRun(test)
		.addError(1, "eval can be harmful.")
		.addError(2, "document.write can be a form of eval.")
		.addError(3, "document.write can be a form of eval.")
		.addError(4, "eval can be harmful.")
		.addError(5, "The Function constructor is a form of eval.")
		.addError(6, "Implied eval. Consider passing a function instead of a string.")
		.addError(7, "Implied eval. Consider passing a function instead of a string.")
		.addError(8, "eval can be harmful.")
		.test(src, { es3: true, browser: true });

	TestRun(test).test(src, { es3: true, evil: true, browser: true });

	test.done();
};

/** Option `passfail` tells JSHint to stop at the first error. */
exports.passfail = function (test) {
	var code = [
		'one()',
		'two()',
		'three()',
	];

	TestRun(test)
		.addError(1, "Missing semicolon.")
		.addError(2, "Missing semicolon.")
		.addError(3, "Missing semicolon.")
		.test(code, { es3: true });

	TestRun(test)
		.addError(1, "Missing semicolon.")
		.addError(1, "Stopping. (33% scanned).")
		.test(code, { es3: true, passfail: true });

	test.done();
};

/** Option `plusplus` prohibits the use of increments/decrements. */
exports.plusplus = function (test) {
	var ops = [ '++', '--' ];

	for (var i = 0, op; op = ops[i]; i += 1) {
		TestRun(test).test('var i = j' + op + ';', {es3: true});
		TestRun(test).test('var i = ' + op + 'j;', {es3: true});
	}

	for (i = 0, op = null; op = ops[i]; i += 1) {
		TestRun(test)
			.addError(1, "Unexpected use of '" + op + "'.")
			.test('var i = j' + op + ';', { es3: true, plusplus: true });

		TestRun(test)
			.addError(1, "Unexpected use of '" + op + "'.")
			.test('var i = ' + op + 'j;', { es3: true, plusplus: true });
	}

	test.done();
};

/** Option `strict` requires you to use "use strict"; */
exports.strict = function (test) {
	var code  = "(function (test) { return; }());";
	var code1 = '(function (test) { "use strict"; return; }());';
	var src = fs.readFileSync(__dirname + '/fixtures/strict_violations.js', 'utf8');
	var src2 = fs.readFileSync(__dirname + '/fixtures/strict_incorrect.js', 'utf8');

	TestRun(test).test(code, {es3: true});
	TestRun(test).test(code1, {es3: true});

	TestRun(test)
		.addError(1, 'Missing "use strict" statement.')
		.test(code, { es3: true, strict: true });

	TestRun(test).test(code1, { es3: true, strict: true });

	// Test for strict mode violations
	TestRun(test)
		.addError(4, 'Possible strict violation.')
		.addError(7, 'Strict violation.')
		.addError(8, 'Strict violation.')
		.test(src, { es3: true, strict: true });

	TestRun(test)
		.addError(4, 'Expected an assignment or function call and instead saw an expression.')
		.addError(9, 'Missing semicolon.')
		.addError(28, 'Expected an assignment or function call and instead saw an expression.')
		.addError(53, 'Expected an assignment or function call and instead saw an expression.')
		.test(src2, { es3: true, strict: false });

	TestRun(test).test("var obj = Object({ foo: 'bar' });", { es3: true, strict: true });

	test.done();
};

/** Option `globalstrict` allows you to use global "use strict"; */
exports.globalstrict = function (test) {
	var code = [
		'"use strict";',
		'function hello() { return; }'
	];

	TestRun(test)
		.addError(1, 'Use the function form of "use strict".')
		.test(code, { es3: true, strict: true });

	TestRun(test).test(code, { es3: true, globalstrict: true });

	// Check that globalstrict also enabled strict
	TestRun(test)
		.addError(1, 'Missing "use strict" statement.')
		.test(code[1], { es3: true, globalstrict: true });

	// Don't enforce "use strict"; if strict has been explicitly set to false
	TestRun(test).test(code[1], { es3: true, globalstrict: true, strict: false });

	test.done();
};

exports.validthis = function (test) {
	var src = fs.readFileSync(__dirname + '/fixtures/strict_this.js', 'utf8');

	TestRun(test)
		.addError(8, "Possible strict violation.")
		.addError(9, "Possible strict violation.")
		.addError(11, "Possible strict violation.")
		.test(src, {es3: true});

	src = fs.readFileSync(__dirname + '/fixtures/strict_this2.js', 'utf8');
	TestRun(test).test(src, {es3: true});

	// Test for erroneus use of validthis

	var code = ['/*jshint validthis:true */', 'hello();'];
	TestRun(test)
		.addError(1, "Option 'validthis' can't be used in a global scope.")
		.test(code, {es3: true});

	code = ['function x() {', '/*jshint validthis:heya */', 'hello();', '}'];
	TestRun(test)
		.addError(2, "Bad option value.")
		.test(code, {es3: true});

	test.done();
};

/*
 * Test string relevant options
 *	 multistr	 allows multiline strings
 */
exports.strings = function (test) {
	var src = fs.readFileSync(__dirname + '/fixtures/strings.js', 'utf8');

	TestRun(test)
		.addError(9, "Unclosed string.")
		.addError(10, "Unclosed string.")
		.addError(15, "Unclosed string.")
		.addError(23, "Octal literals are not allowed in strict mode.")

		.test(src, { es3: true });

	test.done();
};

exports.scope = function (test) {
	var src = fs.readFileSync(__dirname + '/fixtures/scope.js', 'utf8');

	TestRun(test, 1)
		.addError(11, "'j' used out of scope.") // 3x
		.addError(12, "'x' used out of scope.")
		.addError(20, "'aa' used out of scope.")
		.addError(27, "'bb' used out of scope.")
		.addError(37, "'cc' is not defined.")
		.addError(42, "'bb' is not defined.")
		.test(src, {es3: true});

	TestRun(test, 2)
		.addError(37, "'cc' is not defined.")
		.addError(42, "'bb' is not defined.")
		.test(src, { es3: true, funcscope: true });

	test.done();
};

/*
 * Tests `esnext` and `moz` options.
 *
 * This test simply makes sure that options are recognizable
 * and do not reset ES5 mode (see GH-1068)
 *
 */
exports.esnext = function (test) {
	var src = fs.readFileSync(__dirname + '/fixtures/const.js', 'utf8');

	var code = [
		'const myConst = true;',
		'const foo = 9;',
		'var myConst = function (test) { };',
		'foo = "hello world";',
		'var a = { get x() {} };'
	];

	TestRun(test)
		.addError(21, "const 'immutable4' is initialized to 'undefined'.")
		.test(src, { esnext: true });

	TestRun(test)
		.addError(21, "const 'immutable4' is initialized to 'undefined'.")
		.test(src, { moz: true });

	TestRun(test)
		.addError(3, "const 'myConst' has already been declared.")
		.addError(4, "Attempting to override 'foo' which is a constant.")
		.test(code, { esnext: true });

	TestRun(test)
		.addError(3, "const 'myConst' has already been declared.")
		.addError(4, "Attempting to override 'foo' which is a constant.")
		.test(code, { moz: true });

	test.done();
};

/*
 * Tests the `browser` option
 */
exports.browser = function (test) {
	var src = fs.readFileSync(__dirname + '/fixtures/browser.js', 'utf8');

	TestRun(test)
		.addError(2, "'atob' is not defined.")
		.addError(3, "'btoa' is not defined.")
		.addError(6, "'DOMParser' is not defined.")
		.addError(10, "'XMLSerializer' is not defined.")
		.addError(14, "'NodeFilter' is not defined.")
		.addError(15, "'Node' is not defined.")
		.addError(18, "'MutationObserver' is not defined.")
		.addError(21, "'SVGElement' is not defined.")
		.test(src, {es3: true, undef: true });

	TestRun(test).test(src, {es3: true, browser: true, undef: true });

	test.done();
};

exports.unnecessarysemicolon = function (test) {
	var code = [
		"function foo() {",
		"    var a;;",
		"}"
	];

	TestRun(test)
		.addError(2, "Unnecessary semicolon.")
		.test(code, {es3: true});

	test.done();
};

exports.blacklist = function (test) {
	var src = fs.readFileSync(__dirname + '/fixtures/browser.js', 'utf8');
	var code = [
		'/*jshint browser: true */',
		'/*global -event, bar, -btoa */',
		'var a = event.hello();',
		'var c = foo();',
		'var b = btoa(1);',
		'var d = bar();'
	];

	// make sure everything is ok
	TestRun(test).test(src, { es3: true, undef: true, browser: true });

	// disallow Node in a predef Object
	TestRun(test)
		.addError(15, "'Node' is not defined.")
		.test(src, {
			undef: true,
			browser: true,
			predef: { '-Node': false }
		});
	// disallow Node and NodeFilter in a predef Array
	TestRun(test)
		.addError(14, "'NodeFilter' is not defined.")
		.addError(15, "'Node' is not defined.")
		.test(src, {
			undef: true,
			browser: true,
			predef: ['-Node', '-NodeFilter']
		});

	TestRun(test)
		.addError(3, "'event' is not defined.")
		.addError(4, "'foo' is not defined.")
		.addError(5, "'btoa' is not defined.")
		.test(code, { es3: true, undef: true });

	test.done();
};

/*
 * Tests the `maxstatements` option
 */
exports.maxstatements = function (test) {
	var src = fs.readFileSync(__dirname + '/fixtures/max-statements-per-function.js', 'utf8');

	TestRun(test)
		.addError(1, "This function has too many statements. (8)")
		.test(src, { es3: true, maxstatements: 7 });

	TestRun(test)
		.test(src, { es3: true, maxstatements: 8 });

	TestRun(test)
		.test(src, { es3: true });

	test.done();
};

/*
 * Tests the `maxdepth` option
 */
exports.maxdepth = function (test) {
	var fixture = '/fixtures/max-nested-block-depth-per-function.js';
	var src = fs.readFileSync(__dirname + fixture, 'utf8');

	TestRun(test)
		.addError(5, "Blocks are nested too deeply. (2)")
		.addError(14, "Blocks are nested too deeply. (2)")
		.test(src, { es3: true, maxdepth: 1 });

	TestRun(test)
		.addError(9, "Blocks are nested too deeply. (3)")
		.test(src, { es3: true, maxdepth: 2 });

	TestRun(test)
		.test(src, { es3: true, maxdepth: 3 });

	TestRun(test)
		.test(src, { es3: true });

	test.done();
};

/*
 * Tests the `maxparams` option
 */
exports.maxparams = function (test) {
	var fixture = '/fixtures/max-parameters-per-function.js';
	var src = fs.readFileSync(__dirname + fixture, 'utf8');

	TestRun(test)
		.addError(4, "This function has too many parameters. (3)")
		.test(src, { es3: true, maxparams: 2 });

	TestRun(test)
		.test(src, { es3: true, maxparams: 3 });

	TestRun(test)
		.test(src, { es3: true });

	test.done();
};

/*
 * Tests the `maxcomplexity` option
 */
exports.maxcomplexity = function (test) {
	var fixture = '/fixtures/max-cyclomatic-complexity-per-function.js';
	var src = fs.readFileSync(__dirname + fixture, 'utf8');

	TestRun(test)
		.addError(8, "This function's cyclomatic complexity is too high. (2)")
		.addError(15, "This function's cyclomatic complexity is too high. (2)")
		.addError(25, "This function's cyclomatic complexity is too high. (2)")
		.addError(47, "This function's cyclomatic complexity is too high. (8)")
		.addError(76, "This function's cyclomatic complexity is too high. (2)")
		.addError(80, "This function's cyclomatic complexity is too high. (2)")
		.test(src, { es3: true, maxcomplexity: 1 });

	TestRun(test)
		.test(src, { es3: true, maxcomplexity: 8 });

	TestRun(test)
		.test(src, { es3: true });

	test.done();
};

// Metrics output per function.
exports.fnmetrics = function (test) {
	var rep = jshint.run([
		"function foo(a, b) { if (a) return b; }",
		"function bar() { var a = 0; a += 1; return a; }"
	]);

	test.deepEqual(rep.data.functions[0].metrics, {
		complexity: 2,
		parameters: 2,
		statements: 1
	});

	test.deepEqual(rep.data.functions[1].metrics, {
		complexity: 1,
		parameters: 0,
		statements: 3
	});

	test.done();
};

/*
 * Tests ignored warnings.
 */
exports.ignored = function (test) {
	var src = fs.readFileSync(__dirname + "/fixtures/ignored.js", "utf-8");

	TestRun(test)
		.addError(4, "A trailing decimal point can be confused with a dot: '12.'.")
		.addError(12, "Missing semicolon.")
		.test(src, { es3: true });

	TestRun(test)
		.addError(12, "Missing semicolon.")
		.test(src, { es3: true, "-W047": true });

	test.done();
};

/*
 * Tests ignored warnings being unignored.
 */
exports.unignored = function (test) {
	var src = fs.readFileSync(__dirname + "/fixtures/unignored.js", "utf-8");

	TestRun(test)
		.addError(5, "A leading decimal point can be confused with a dot: '.12'.")
		.test(src, { es3: true });

	test.done();
};

/*
* Tests the `freeze` option -- Warn if native object prototype is assigned to.
*/
exports.freeze = function (test) {
	var src = fs.readFileSync(__dirname + "/fixtures/nativeobject.js", "utf-8");

	TestRun(test)
		.addError(3, "Extending prototype of native object: 'Array'.")
		.addError(13, "Extending prototype of native object: 'Boolean'.")
		.test(src, { freeze: true });

	TestRun(test)
		.test(src);

	test.done();
};
