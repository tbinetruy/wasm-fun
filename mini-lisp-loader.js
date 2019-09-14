// loads lisp code into memory
// it preprocesses the code by mapping func/var names to integers

import Test  from "./Test.js";
import { SIZE, DELIMETERS, TOKEN, token_names } from "./consts.js";
import { read_list, map_token_to_number } from "./helpers.js";


class Mini_lisp_loader {
    /**
    * Objects instantiated from this class can load lisp code in wasm memory
    * using the wasm linked list API.
    * @param {Dict<functions>} api - wasm lisp functions
    */
    constructor(api, memory) {
        this.api = api;
        this.token_names = token_names;
    }

    /**
    * Loads code in wasm memory by storing it in a list. We go through the expression tree
    * recursively: either the current element is an object in wich case we recurse, or it is
    * not and we add it to the list.
    * @param {intAST} expr - contains the processed AST
    */
    load_expr_in_mem(expr) {
        const list_p = this.api.create_list();
        for(let i = 0; i < expr.length; i++) {
            const first_el = expr[i];
            if(typeof(first_el) === "object") {
                this.api.add_element(
                    list_p,
                    this.load_expr_in_mem(expr[i]),
                    DELIMETERS.type_object
                );
            } else {
                this.api.add_element(list_p, expr[i], DELIMETERS.type_i32);
            }
        }

        return list_p;
    }

    /**
    * Replaces an expression's variable and function names with integers bijectively. This is
    * simpler to store in memory and takes less space.
    * @param {Expression} expr - A lisp expression
    * @param {Array<String>} var_names - Variable and function names as strings that are in
    *     the current closure.
    * @returns {intAST} the expression converted to nested arrays of integers.
    * @throws {VariableError} Read undeclared variables and vice-versa.
    */
    process_expr(expr, var_names = []) {
        if(typeof(expr) === "number")
            return expr;

        // the converted expression
        const new_expr = [];

        // Fist element in expression
        const first_el = expr[0];

        // If the first element of the expression is another expression,
        // we recurse and push the result
        if(typeof(first_el) === "object") {
            new_expr.push(this.process_expr(first_el), [...var_names]);
        }
        // If the first element is a string, then it is a function name.
        else if(typeof(first_el) === "string") {
            let el_name = this.map_token_to_number(first_el);
            el_name = el_name != -1 ? el_name : this.map_varname_to_number(first_el, var_names);
            new_expr.push(el_name);

            if(first_el === TOKEN.function) {
                // handle function name
                const func_name = expr[1];
                new_expr.push(this.map_varname_to_number(func_name, var_names));

                // handle function arguments
                const params = expr[2];
                const new_params = [];
                const l0 = var_names.length;
                for(let i = 0; i < params.length; i++) {
                    var_names.push(params[i]);
                    new_params.push(l0 + i);
                }
                new_expr.push(new_params);

                // handle function body
                for(let i = 3; i < expr.length; i++)
                    new_expr.push(this.process_expr(expr[i], [...var_names]));
            } else if(first_el === TOKEN.declare_local_var) {
                // ['let', [[name1, value1], ..., [nameN, valueN]], bodyExpr1, ..., bodyExprM]

                // handle declarations which are of type (str, expr)
                const params = [];
                for(let subexpr of expr[1]) {
                    const local_var_name = subexpr[0];
                    const local_var_value = subexpr[1];
                    if(var_names.includes(local_var_name))
                        throw "Variable already exists";

                    var_names.push(local_var_name);
                    params.push([
                        var_names.length - 1,
                        this.process_expr(local_var_value, [...var_names])
                    ]);
                }
                new_expr.push(params);

                // handle body
                for(let i = 2; i < expr.length; i++)
                    new_expr.push(this.process_expr(expr[i], [...var_names]));
            } else if (first_el === TOKEN.read_local_var) {
                // ['read', varname]
                const local_var_name = expr[1];
                if(!var_names.includes(local_var_name))
                    throw "Variable does not exists";
                new_expr.push(this.map_varname_to_number(local_var_name, var_names));
            } else {
                // TODO: see if this ever runs...
                for(let i = 1; i < expr.length; i++) {
                    new_expr.push(this.process_expr(expr[i], [...var_names]));
                }
            }


            return new_expr;
        } else {
            throw "Error";
        }

        return new_expr;
    }

    /**
    * Bijectively map a token string to an integer. A token being a stdlib function name.
    * @param {String} token - Token name in string space.
    * @returns {Integer} token name in integer space.
    */
    map_token_to_number(token) {
        return map_token_to_number(token);
    }

    /**
     * Bijectively map a string variable name to an integer taking into account stdlib
     * function names.
     * @param {String} token - Token name in string space.
     * @returns {Integer} token name in integer space.
     */
    map_varname_to_number(var_name, var_names) {
        for(let i = 0; i < var_names.length; i++) {
            if(var_names[i] === var_name)
                return i;
        }
        var_names.push(var_name);
        return var_names.length - 1;
    }
}

class Test_mini_lisp_loader extends Test {
    init_mem(mem) {
        const i32 = new Uint32Array(mem.buffer);

        for (let i = 0; i < 2000; i++) {
            i32[i] = DELIMETERS.null;
        }
    }

    test_suite(exports) {
        const lisp = new Mini_lisp_loader(exports);

        const code = this.get_code();

        const processed_code = lisp.process_expr(code);
        this.test(JSON.stringify(processed_code), this.get_processed_code());

        const code_p = lisp.load_expr_in_mem(processed_code);
        const code_as_list = this.read_list(code_p);
        this.test(JSON.stringify(code_as_list), this.get_processed_code());
    }

    get_processed_code() {
        return JSON.stringify(
            [7,
             [0, 0, [1, 2],
              [7,
               [2, [6, 1]],
               [1, [[3, [3, 1, 2, 3]], [4, [4, 44, 45, 46]]],
                [7,
                 [2, [6, 3]],
                 [5, [6, 4]],
                 [6, 3]]]]],
             [0, [3, 1, 6, 2]]]
        );
    }

    get_code() {
        return ['progn',
                    ['func', 'my_func', ['baz', 'bat'],
                        ['progn',
                            ['print', ['read', 'baz']],
                            ['let', [['foo', ['list', 1, 2, 3]], ['bar', ['string', 44, 45, 46]]],
                                ['progn',
                                    ['print', ['read', 'foo']],
                                    ['print_string', ['read', 'bar']],
                                    ['read', 'foo']]]]],
                    ['my_func', ['list', 1, 6, 2]]];
    }
}

new Test_mini_lisp_loader("Mini lisp");

export default Mini_lisp_loader;
