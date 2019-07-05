import { DELIMETERS, SIZE } from "./consts.js";
import { read_list } from "./helpers.js";


class Test {
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

    read_list(addr) {
        return read_list(addr, this.memory);
    }

    debug() {
        window.mem = new Uint32Array(this.memory.buffer);
        console.log("============");
    }

    test(a, b) {
        if(a == b) {
            this.result_info.pass += 1;
        } else {
            this.result_info.fail += 1;
            this.result_info.comments.push("Fail " + a + " != " + b);
        }
    }

    print_results() {
        console.log("Pass: ", this.result_info.pass, ", Fail: ", this.result_info.fail);
        for(let comment of this.result_info.comments)
            console.log(comment);
    }

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

    test_suite(exports) {
        // To override when inheriting
    }

    init_mem(mem) {
        // To override when inheriting
    }

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
