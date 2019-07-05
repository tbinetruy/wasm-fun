import Test, { SIZE, DELIMETERS, read_list } from "./Test.js";

const TOKEN = {
    function: 'func',
    declare_local_var: 'let',
    print: 'print',
    create_list: 'list',
    create_string: 'string',
    print_string: 'print_string',
    read_local_var: 'read',
    block_declaration: 'progn',
};


class Mini_lisp {
    constructor(api, memory) {
        this.api = api;
        this.token_names = Object.values(TOKEN);
        this.memory = memory;
    }

    run(code) {
        const processed_code = this.process_expr(code);
    }

    load_expr_in_mem(expr) {
        const list_p = this.api.create_list();
        for(let i = 0; i < expr.length; i++) {
            const first_el = expr[i];
            if(typeof(first_el) === "object") {
                this.api.add_element(list_p, this.load_expr_in_mem(expr[i]), DELIMETERS.type_object);
            } else {
                this.api.add_element(list_p, expr[i], DELIMETERS.type_i32);
            }
        }

        return list_p;
    }

    process_expr(expr, var_names = []) {
        if(typeof(expr) === "number")
            return expr;

        const new_expr = [];

        const first_el = expr[0];

        if(typeof(first_el) === "object") {
            new_expr.push(this.process_expr(first_el), [...var_names]);
        } else if(typeof(first_el) === "string") {
            let el_name = this.map_token_to_number(first_el);
            el_name = el_name != -1 ? el_name : this.map_varname_to_number(first_el, var_names);
            new_expr.push(el_name);

            if(first_el === TOKEN.function) {
                const func_name = expr[1];
                new_expr.push(this.map_varname_to_number(func_name, var_names));

                const params = expr[2];
                const new_params = [];
                const l0 = var_names.length;
                for(let i = 0; i < params.length; i++) {
                    var_names.push(params[i]);
                    new_params.push(l0 + i);
                }
                new_expr.push(new_params);

                for(let i = 3; i < expr.length; i++)
                    new_expr.push(this.process_expr(expr[i], [...var_names]));
            } else if(first_el === TOKEN.declare_local_var) {
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

                for(let i = 2; i < expr.length; i++)
                    new_expr.push(this.process_expr(expr[i], [...var_names]));
            } else if (first_el === TOKEN.read_local_var) {
                const local_var_name = expr[1];
                if(!var_names.includes(local_var_name))
                    throw "Variable does not exists";
                new_expr.push(this.map_varname_to_number(local_var_name, var_names));
            } else {
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

    map_token_to_number(token) {
        for(let i = 0; i < this.token_names.length; i++) {
            if(this.token_names[i] === token)
                return i;
        }
        return -1;
    }

    map_varname_to_number(var_name, var_names) {
        for(let i = 0; i < var_names.length; i++) {
            if(var_names[i] === var_name)
                return i;
        }
        var_names.push(var_name);
        return var_names.length - 1;
    }

    encode_expr(code) {
        const list_p = this.api.create_list();

        for(let instruction of code) {
            const first_el = code[0];

            if(typeof(first_el) === "object") {
                const sublist_p = this.encode_expr(first_el);
                this.api.add_element(list_p, sublist_p);
            } else if(typeof(first_el) === "string") {
                let el_name = this.default_func_name_to_number(first_el);
                el_name = el_name != -1 ? el_name : this.var_name_to_number(first_el);
                const el_p = this.api.create_list_el(
                    DELIMETERS.type_i32,
                    el_name,
                    DELIMETERS.list_end,
                );
                this.api.add_element(list_p, el_p);

                if(first_el == TOKEN.function) {
                }
            } else {
                throw "Error";
            }

            for(let i = 1; i < code.length; i++) {
                const sublist_p = this.encode_expr();
                this.api.add_element(list_p, sublist_p);
            }
        }
    }

    create_var(expr, rc_tab, env) {
        const var_addr = this.encode_expr(expr);

        const env_entry = this.api.create_list();
        this.api.add_element(env_entry, 1, DELIMETERS.type_i32);
        this.api.add_element(env_entry, var_addr, DELIMETERS.type_object);

        this.api.add_element(env, env_entry);

        this.api.add_to_rc_tab(rc_tab, var_addr);
        this.api.increase_rc_counter(rc_tab, var_addr);

        return var_addr;
    }

    eval_expr(expr_addr, rc_tab, env) {
        return 0;
    }

    create_env(create_list) {
        const rc_tab = create_list(); // maps addresses to reference count
        const env = create_list();    // maps var names to addresses
        return [rc_tab, env];
    }
}

class Test_mini_parser extends Test {
    init_mem(mem) {
        const i32 = new Uint32Array(mem.buffer);

        for (let i = 0; i < 2000; i++) {
            i32[i] = DELIMETERS.null;
        }
    }

    test_suite(exports) {
        const lisp = new Mini_lisp(exports, this.memory);

        const code = this.get_code();
        const result = lisp.run(code);

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

new Test_mini_parser("Mini lisp");
