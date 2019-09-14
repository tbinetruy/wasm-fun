import { DELIMETERS, SIZE } from "./consts.js";
import { read_list } from "./helpers.js";


class Test {
    /**
    * Class to be inherited to easily test wasm code.
    * @param {string} docstring - Test description.
    * @property {Dict} result_info - Test result statistics
    */
    constructor(docstring) {
        this.test = this.test.bind(this);
        this.load_wasm = this.load_wasm.bind(this);
        this.test_suite = this.test_suite.bind(this);
        this.init_mem = this.init_mem.bind(this);
        this.get_mem = this.get_mem.bind(this);

        this.result_info = {
            fail: 0,
            pass: 0,
            comments: [],
        };

        this.docstring = docstring;
        this.load_wasm();
    }

    /**
    * Patch a memory array.
    * @param {Uint32Array} _mem - Memory array.
    * @param {Array<Array<Integer>>} patch - Memory patch, elements are of the form [address, new_value].
    * @returns {Array} New memory layout.
    */
    patch_mem(_mem, patch) {
        const mem = [..._mem];
        for(let i = 0; i < mem.length; i++) {
            for(let j = 0; j < patch.length; j++) {
                if(patch[j][0] == i) {
                    mem[i] = patch[j][1];
                }
            }
        }
        return mem;
    }

    /**
    * Read list from memory
    * @param {Integer} addr - Pointer to list
    * @returns {Array} JS list representation.
    */
    read_list(addr) {
        return read_list(addr, this.memory);
    }

    /**
    * Stores the memory buffer in the browser window object and logs a line.
    */
    debug() {
        window.mem = new Uint32Array(this.memory.buffer);
        console.log("============");
    }

    /**
    * Asserts weak equality between two values
    * @param {any} a - element A
    * @param {any} b - element B
    */
    test(a, b) {
        if(a == b) {
            this.result_info.pass += 1;
        } else {
            this.result_info.fail += 1;
            this.result_info.comments.push("Fail " + a + " != " + b);
        }
    }

    /**
    * Print the test output for this suite.
    */
    print_results() {
        console.log("Pass: ", this.result_info.pass, ", Fail: ", this.result_info.fail);
        for(let comment of this.result_info.comments)
            console.log(comment);
    }

    /**
    * Loads the wasm code with the memory layout provided by `this.get_mem` and globals.
    * It then runs the test suite by calling `this.test_suite` with the wasm exports as
    * argument. Finally, it prints the test results.
    */
    async load_wasm() {
        const memory = this.get_mem();

        const globals = {
            size_int: SIZE.i32,
            list_start_char: DELIMETERS.list_start,
            list_end_char: DELIMETERS.list_end,
            null_char: DELIMETERS.null,
            type_int: DELIMETERS.type_i32,
            type_object: DELIMETERS.type_object,
        };
        const importObject = { js: { mem: memory }, globals };
        const response = await fetch("linked_list.wasm");
        const buffer = await response.arrayBuffer();
        const obj = await WebAssembly.instantiate(buffer, importObject);

        console.log("============ " + this.docstring + " ============");
        this.test_suite(obj.instance.exports);
        this.print_results();
    }

    /**
    * Test suite to run with given webassembly exports and memory layout.
    * @param {Dict<Function>} exports - WASM exports you can use.
    */
    test_suite(exports) {
        // To override when inheriting
    }

    /**
    * Inits the memory layout
    * @param {WebAssembly.Memory} mem - Memory to patch.
    */
    init_mem(mem) {
        // To override when inheriting
    }

    /**
    * Creates a webassembly memory object and stores it in `this.memory`.
    * @returns {WebAssembly.Memory} Webassembly memory object to use in tests.
    */
    get_mem() {
        const memory = new WebAssembly.Memory({initial:1});
        this.init_mem(memory);
        this.memory = memory;
        return memory;
    }

    mem_quick_init(mem, [start, offset, end], start_offset = 0) {
        const i32 = new Uint32Array(mem.buffer);

        for (let i = 0; i < 20 * end; i++) {
            i32[i] = DELIMETERS.null;
        }
        for (let i = start_offset; i < start; i++) {
            i32[i] = 1;
        }
        for (let i = start + offset; i < end; i++) {
            i32[i] = 1;
        }

        this.c = start;
        this.d = end;
        this.offset = offset;
    }
}

export default Test;
