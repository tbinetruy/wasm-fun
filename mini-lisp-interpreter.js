import Test  from "./Test.js";
import { SIZE, DELIMETERS, TOKEN } from "./consts.js";
import { read_list } from "./helpers.js";
import Lisp_loader from "./mini-lisp-loader.js";

class Mini_lisp_interpreter {
    constructor(api, memory) {
        this.api = api;
        this.token_names = Object.values(TOKEN);
        this.memory = memory;
    }

    run(code_p) {
        const env = this.create_env();
        const rc_tab = this.create_rc_tab();

        return this.eval_expr(code_p, rc_tab, env);
    }

    eval_expr(expr_addr, rc_tab, env) {
        const ast = read_list(expr_addr, this.memory);
        return 0;
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
        return ['let', [['foo', answer]], 'foo'];
    }
}

new Test_mini_lisp_interpreter("Mini lisp interpreter");
