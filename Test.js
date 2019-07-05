const SIZE = {
    i32: 4,
};

const DELIMETERS = {
    list_start: 1000,
    list_end: 2000,
    null: 3000,
    type_i32: 1010,
    type_object: 2010,
    type_char: 2011,
    type_function: 2012,
};

function read_list(addr, memory) {
    const list = [];
    addr = addr / SIZE.i32;

    const i32 = new Uint32Array(memory.buffer);

    const next_addr = i32[addr + 2];
    if (next_addr === DELIMETERS.list_end)
        return list;

    addr = next_addr / SIZE.i32;
    do {
        const type = i32[addr];
        const value = i32[addr + 1];
        const next_addr = i32[addr + 2];

        if (type === DELIMETERS.type_object)
            list.push(read_list(value, memory));
        else
            list.push(value);

        if (next_addr === DELIMETERS.list_end) {
            return list;
        }
        addr = next_addr / SIZE.i32;
    } while(1);

    return -1;
}


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
export {
    SIZE, DELIMETERS, read_list
};
