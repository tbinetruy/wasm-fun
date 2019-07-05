import Test  from "./Test.js";
import { SIZE, DELIMETERS, TOKEN } from "./consts.js";
import { read_list, map_token_to_number } from "./helpers.js";
import Lisp_loader from "./mini-lisp-loader.js";

class Mini_lisp_interpreter {
    constructor(api, memory) {
        this.api = api;
        this.token_names = Object.values(TOKEN);
        this.memory = memory;
        this.rc_tab_p = this.create_rc_tab();
    }

    run(code_p) {
        const env_p = this.create_env();

        return this.eval_expr(code_p, env_p);
    }

    read_list(list_p) {
        const list = [];

        const next_p = this.api.cdr(list_p);
        if (next_p === DELIMETERS.list_end)
            return list;

        let current_el_p = next_p;
        let next_el_p = 0;
        do {
            const type = this.api.get_type(current_el_p);
            const value = this.api.car(current_el_p);
            next_el_p = this.api.cdr(current_el_p);

            if (type === DELIMETERS.type_object)
                list.push(this.read_list(value));
            else
                list.push(value);

            current_el_p = next_el_p;
        } while(next_el_p !== DELIMETERS.list_end);

        return list;
    }

    eval_declare_local_var(expr_addr, env_p) {
        const declarations_p = this.api.car(this.api.find_nth_element(expr_addr, 2));
        const l = this.api.get_list_length(declarations_p);
        for(let i = 1; i <= l; i++) {
            const declaration_p = this.api.car(this.api.find_nth_element(declarations_p, i));
            const env_entry_p = this.api.create_list();
            this.api.add_element(env_p, env_entry_p, DELIMETERS.type_object);

            const symbol = this.api.car(this.api.find_nth_element(declaration_p, 1));
            const value_p = this.api.find_nth_element(declaration_p, 2);
            const value = this.api.car(value_p);
            const value_type = this.api.get_type(value_p);

            this.api.add_element(env_entry_p, symbol, DELIMETERS.type_i32);
            if(value_type === DELIMETERS.type_object) {
                this.api.add_element(env_entry_p, this.eval_expr(value, env_p), value_type);
            } else {
                this.api.add_element(env_entry_p, value, value_type);
            }
        }

        const body_p = this.api.car(this.api.find_nth_element(expr_addr, 3));
        const return_value = this.eval_expr(body_p, env_p);

        for(let i = 1; i <= l; i++) {
            const declaration_p = this.api.car(this.api.find_nth_element(declarations_p, i));
            const symbol = this.api.car(this.api.find_nth_element(declaration_p, 1));
            const value_p = this.api.find_nth_element(declaration_p, 2);
            const value_type = this.api.get_type(value_p);

            if(value_type === DELIMETERS.type_object) {
                const p = this.api.find_value_in_alist_from_key(env_p, symbol);
                this.api.decrease_rc(this.rc_tab_p, this.api.car(p));
            }
        }

        this.garbage_collect();

        return return_value;
    }

    print_list(list_p) {
        console.log(JSON.stringify(this.read_list(list_p)));
    }

    garbage_collect() {
        this.api.garbage_collect(this.rc_tab_p);
        this.api.clean_rc_tab(this.rc_tab_p);
    }

    read_expr(expr_addr) {
        return read_list(expr_addr, this.memory);
    }

    create_list(expr_p, env_p) {
        const list_p = this.api.create_gc_list(this.rc_tab_p);
        this.api.increase_rc(this.rc_tab_p, list_p);

        const l = this.api.get_list_length(expr_p);
        for(let i = 2; i <= l; i++) {
            const el_p = this.api.find_nth_element(expr_p, i);
            this.api.add_element(list_p, this.eval_expr(el_p, env_p), this.api.get_type(el_p));
        }


        return list_p;
    }

    eval_expr(expr_p, env_p) {
        if(this.api.get_type(expr_p) === DELIMETERS.type_i32) {
            return this.api.car(expr_p);
        }

        const first_el_p = this.api.find_nth_element(expr_p, 1);
        const first_el_type = this.api.get_type(first_el_p);

        const first_el_value = this.api.car(first_el_p);

        const test = token => first_el_value === map_token_to_number(token);
        if(test(TOKEN.declare_local_var)) {
            return this.eval_declare_local_var(expr_p, env_p);
        } else if(test(TOKEN.read_local_var)) {
            return this.eval_local_var(expr_p, env_p);
        } else if(test(TOKEN.create_list)) {
            return this.create_list(expr_p, env_p);
        }

        return -1;
    }

    eval_local_var(expr_p, env_p) {
        const symbol = this.api.car(this.api.find_nth_element(expr_p, 2));
        const value = this.api.find_value_in_alist_from_key(env_p, symbol);
        return this.eval_expr(value, env_p);
    }

    create_rc_tab() {
        // maps addresses to reference count
        return this.api.create_list();
    }

    create_env() {
        // maps symbols to address
        return this.api.create_list();
    }
}

class Test_mini_lisp_interpreter extends Test {
    init_mem(mem) {
        const i32 = new Uint32Array(mem.buffer);

        for (let i = 0; i < 2000; i++) {
            i32[i] = DELIMETERS.null;
        }
    }

    test_suite(exports) {
        const lisp_loader = new Lisp_loader(exports, this.memory);
        const lisp_interpreter = new Mini_lisp_interpreter(exports, this.memory);

        const answer = 12;
        const code = this.get_code(answer);

        const processed_code = lisp_loader.process_expr(code);
        const code_p = lisp_loader.load_expr_in_mem(processed_code);

        const result = lisp_interpreter.run(code_p);
        this.test(result, answer);
    }

    get_code(answer) {
        return ['let', [['foo', answer], ['bar', ['list', 1, 2]]], ['read', 'foo']];
    }
}

new Test_mini_lisp_interpreter("Mini lisp interpreter");
