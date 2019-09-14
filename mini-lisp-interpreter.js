import Test  from "./Test.js";
import { SIZE, DELIMETERS, TOKEN } from "./consts.js";
import { read_list, map_token_to_number } from "./helpers.js";
import Lisp_loader from "./mini-lisp-loader.js";

class Mini_lisp_interpreter {
    /**
    * Instantiates an object that interprets lisp code from wasm memory. It uses the
    * linked list api in order to read, process and garbage collect the code.
    * @param {Dict<functions>} api - wasm lisp functions
    * @param {Uint32Array} memory - wasm memory.
    */
    constructor(api, memory) {
        this.api = api;
        this.token_names = Object.values(TOKEN);
        this.memory = memory;
        this.rc_tab_p = this.create_rc_tab();
    }

    /**
    * Ran code from memory
    * @param {Integer} code_p - pointer to the memory location of the first instruction to run
    * @returns {LispExprResult} Result of the expression.
    */
    run(code_p) {
        const env_p = this.create_env();

        return this.eval_expr(code_p, env_p);
    }

    /**
    * Reads a linked list from wasm memory and returns its JS representation.
    * @param {Integer} list_p - pointer to the list start address.
    * @returns {Array} nested js array representation of the input list.
    */
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

    /**
    * Declare variables and store them in the environment.
    * @param {Integer} expr_addr - Pointer to the start address of the declaration instruction
    * @param {Integer} env_p - Pointer to the environment list
    * @returns {ExprResult} lisp expression result.
    */
    eval_declare_local_var(expr_addr, env_p) {
        // the declaration instruction looks like:
        // ['let', [[a1, value1], ..., [aN, valueN]], bodyExpr]
        // Since the list head ('let') is element 1, our declarations start at element 2.
        const declarations_p = this.api.car(this.api.find_nth_element(expr_addr, 2));
        const l = this.api.get_list_length(declarations_p);

        // We loop through the N (name, value) pair of declarations.
        for(let i = 1; i <= l; i++) {
            // we create a new entry in the environment to store the variable
            const env_entry_p = this.api.create_list();
            this.api.add_element(env_p, env_entry_p, DELIMETERS.type_object);

            // we create a pointer to the declaration list start
            const declaration_p = this.api.car(this.api.find_nth_element(declarations_p, i));

            const symbol = this.api.car(this.api.find_nth_element(declaration_p, 1));
            const value_p = this.api.find_nth_element(declaration_p, 2);
            const value = this.api.car(value_p);
            const value_type = this.api.get_type(value_p);

            // we store the symbol and its value in the environment.
            this.api.add_element(env_entry_p, symbol, DELIMETERS.type_i32);
            if(value_type === DELIMETERS.type_object) {
                // if the value is an object, evaluate it and store its value.
                // when evaluating it, it will create an entry in the rc_tab with count 1.
                // we will need to decrease this count at the end of the declare lisp expr.
                this.api.add_element(env_entry_p, this.eval_expr(value, env_p), value_type);
            } else {
                this.api.add_element(env_entry_p, value, value_type);
            }
        }

        // We now need to evaluate the body expressions.
        const body_p = this.api.car(this.api.find_nth_element(expr_addr, 3));
        const return_value = this.eval_expr(body_p, env_p);

        // Decrease reference counts of all declared object types
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

        // Clean memory
        this.garbage_collect();

        // Return the body expression result
        return return_value;
    }

    /**
    * Prints a wasm list to the js console
    * @param {Integer} list_p - pointer to the list start.
    */
    print_list(list_p) {
        console.log(JSON.stringify(this.read_list(list_p)));
    }

    /**
    * Free lists that have 0 reference counts and remove entries that have 0 reference count
    * in the rc table.
    */
    garbage_collect() {
        this.api.garbage_collect(this.rc_tab_p);
        this.api.clean_rc_tab(this.rc_tab_p);
    }

    /**
    * Returns a js list from a wasm list pointer
    * @param {Integer} expr_p - pointer to the expression list start
    * @returns {Array} JS representation of the wasm list
    */
    read_expr(expr_p) {
        return read_list(expr_p, this.memory);
    }

    /**
    * Create a garbage collected list. It evaluates each list element before appending them.
    * @param {Integer} expr_p - Pointer to the expression list start
    * @param {Integer} env_p - Pointer to the environment
    * @returns {Integer} Pointer to the create list
    */
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

    /**
    * Evaluates a lisp expression
    * @param {Integer} expr_p - Pointer to the expression start
    * @param {Integer} env_p - Pointer to the environment
    * @returns {ExprResult} An integer or a pointer to the expression result.
    * TODO: make it return an ExprResult object to keep track of result type.
    */
    eval_expr(expr_p, env_p) {
        // If the expression is an integer, return it
        if(this.api.get_type(expr_p) === DELIMETERS.type_i32) {
            return this.api.car(expr_p);
        }

        // Otherwise it's a function to evaluate. We first recover the function to evaluate,
        // it's the list's first element, and call it accordingly.

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

    /**
    * Evaluate a local variable
    * @param {Integer} expr_p - Pointer to expression list start
    * @param {Integer} env_p - Pointer to environment
    * @returns {ExprResult} Result of the evaluation
    */
    eval_local_var(expr_p, env_p) {
        const symbol = this.api.car(this.api.find_nth_element(expr_p, 2));
        const value = this.api.find_value_in_alist_from_key(env_p, symbol);
        return this.eval_expr(value, env_p);
    }

    /**
    * Maps addresses to reference count
    * @returns {Integer} Pointer to rc_tab list.
    */
    create_rc_tab() {
        return this.api.create_list();
    }

    /**
    * Maps symbols to address
    * @returns {Integer} Pointer to environment list.
    */
    create_env() {
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
        const lisp_loader = new Lisp_loader(exports);
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
