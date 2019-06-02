const SIZE = {
    i32: 4,
};

const DELIMETERS = {
    null: 0,
    list_start: 100,
    list_end: 200,
};

class Test {
    constructor() {
        this.test = this.test.bind(this);
        this.load_wasm = this.load_wasm.bind(this);
        this.test_suite = this.test_suite.bind(this);
        this.init_mem = this.init_mem.bind(this);
        this.get_mem = this.get_mem.bind(this);

        this.load_wasm();
    }

    test(a, b) {
        if(a == b)
            console.log("Pass", a, " == ", b);
        else
            console.log("Fail", a, " != ", b);
    }

    async load_wasm() {
        const memory = this.get_mem();

        const globals = {
            size_int: SIZE.i32,
            list_start_char: DELIMETERS.list_start,
            list_end_char: DELIMETERS.list_end,
            null_char: DELIMETERS.null,
        };
        const importObject = { js: { mem: memory }, globals };
        const response = await fetch("linked_list.wasm");
        const buffer = await response.arrayBuffer();
        const obj = await WebAssembly.instantiate(buffer, importObject);

        this.test_suite(obj.instance.exports);
    }

    test_suite(exports) {
        // To override when inheriting
    }

    init_mem(mem) {
        // To override when inheriting
    }

    get_mem() {
        var memory = new WebAssembly.Memory({initial:1});
        this.init_mem(memory);
        return memory;
    }

    mem_quick_init(mem, [start, offset, end], start_offset = 0) {
        let i32 = new Uint32Array(mem.buffer);

        for (let i = 0; i < 2 * end; i++) {
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


class Test_find_free extends Test {
    init_mem(mem) {
        this.mem_quick_init(mem, [10, 4, 24]);
    }

    test_suite(exports) {
        const { find_free } = exports;
        this.test(find_free(0), this.c * SIZE.i32);
        this.test(find_free((this.c - 9) * SIZE.i32), this.c * SIZE.i32);
        this.test(find_free(this.c * SIZE.i32), this.c * SIZE.i32);
        this.test(find_free((this.c + 1) * SIZE.i32), (this.c + 1) * SIZE.i32);
        this.test(find_free((this.c + this.offset) * SIZE.i32), (2 * this.c + this.offset) * SIZE.i32);
    }
}

class Test_check_free_space extends Test {
    init_mem(mem) {
        const offset = SIZE.i32;
        this.mem_quick_init(mem, [10, offset + 1, 20]);
        this.offset = offset;
    }

    test_suite(exports) {
        const { check_free_space } = exports;
        this.test(check_free_space(0, 4 * SIZE.i32), 0);
        this.test(check_free_space(0, this.c * SIZE.i32), 0);
        this.test(check_free_space(0, (this.c + 1) * SIZE.i32), 0);
        this.test(check_free_space(this.c * SIZE.i32, (this.offset - 1) * SIZE.i32), 1);
        this.test(check_free_space(this.c * SIZE.i32, this.offset * SIZE.i32), 1);
        this.test(check_free_space(this.c * SIZE.i32, (this.offset + 1) * SIZE.i32), 0);
        this.test(check_free_space(this.d * SIZE.i32, this.offset * SIZE.i32), 1);
    }
}

class Test_malloc extends Test {
    init_mem(mem) {
        this.mem_quick_init(mem, [10, 10, 30], SIZE.i32);
    }

    test_suite(exports) {
        const { malloc } = exports;
        this.test(malloc(SIZE.i32), 0);
        this.test(malloc(4 * SIZE.i32), this.c * SIZE.i32);
        this.test(malloc((this.offset + 1) * SIZE.i32), this.d * SIZE.i32);
    }
}

class Test_create_list extends Test {
    init_mem(mem) {
        this.memory = mem;

        this.mem_quick_init(mem, [10, 100, 300]);
    }

    test_suite(exports) {
        const { create_list } = exports;
        this.test(create_list(), this.c * SIZE.i32);

        let i32 = new Uint32Array(this.memory.buffer);
        this.test(i32[this.c], DELIMETERS.list_start);
        this.test(i32[this.c + 1], DELIMETERS.list_end);
        this.test(i32[this.c + 2], DELIMETERS.list_end);
    }
}

class Test_is_list_empty extends Test {
    init_mem(mem) {
        const spec = [
            DELIMETERS.list_start,
            DELIMETERS.list_end,
            DELIMETERS.list_end,
            0,
            DELIMETERS.list_start,
            1,
            DELIMETERS.list_end,
        ];

        let i32 = new Uint32Array(mem.buffer);
        for(let i = 0; i < spec.length; i++) {
            i32[i] = spec[i];
        }
    }

    test_suite(exports) {
        const { create_list, is_list_empty } = exports;
        const list1_addr = 0;
        const list2_addr = 4 * SIZE.i32;
        this.test(is_list_empty(list1_addr), 1);
        this.test(is_list_empty(list2_addr), 0);
    }
}

class Test_find_last_element extends Test {
    init_mem(mem) {
        const spec = [
            DELIMETERS.list_start, // list starts
            15,                    // value
            4 * SIZE.i32,          // next address
            DELIMETERS.null,
            15,                    // value
            9 * SIZE.i32,          // next address
            DELIMETERS.null,
            DELIMETERS.null,
            DELIMETERS.null,
            15,                    // value
            DELIMETERS.list_end,   // list ends
            DELIMETERS.null,
            DELIMETERS.null,
            DELIMETERS.null,
            DELIMETERS.list_start, // list starts
            15,
            DELIMETERS.list_end,   // list ends
        ];

        let i32 = new Uint32Array(mem.buffer);
        for(let i = 0; i < spec.length; i++) {
            i32[i] = spec[i];
        }
    }

    test_suite(exports) {
        const { find_last_element } = exports;
        const list1_addr = 0;
        const list2_addr = 14 * SIZE.i32;
        this.test(find_last_element(list1_addr), 9 * SIZE.i32);
        this.test(find_last_element(list2_addr), list2_addr + SIZE.i32);
    }
}

class Test_add_element extends Test {
    init_mem(mem) {
        this.memory = mem;

        this.mem_quick_init(mem, [10, 1, 20], 4);
    }

    test_suite(exports) {
        const { create_list, add_element } = exports;
        const list_addr = create_list();
        const el1 = 15;
        this.test(add_element(list_addr, el1), list_addr);

        let i32 = new Uint32Array(this.memory.buffer);
        this.test(i32[list_addr / SIZE.i32 + 1], el1);
        this.test(i32[list_addr / SIZE.i32 + 2], DELIMETERS.list_end);

        const el2 = 16;
        add_element(list_addr, el2);

        this.test(i32[this.d], el2);
        this.test(i32[this.d + 1], DELIMETERS.list_end);
    }
}

class Test_integration extends Test {
    init_mem(mem) {
        this.memory = mem;

        this.mem_quick_init(mem, [10, 1, 20], 4);
    }

    read_list(addr) {
        const list = [];
        addr = addr / SIZE.i32;

        let i32 = new Uint32Array(this.memory.buffer);

        if (i32[addr + 1] === DELIMETERS.list_end)
            return list;
        else if (i32[addr + 2] === DELIMETERS.list_end)
            return [i32[addr + 1]];
        window.mem = i32;

        addr += 1;
        do {
            const value = i32[addr];
            const next_addr = i32[addr + 1];
            list.push(value);
            if (next_addr === DELIMETERS.list_end)
                return list;
            addr = next_addr / SIZE.i32;
        } while(1);

        return -1;
    }

    test_suite(exports) {
        const { create_list, add_element } = exports;
        const list_addr = create_list();
        const els = [1, 2, 5, 4, 3, 6, 7];
        for(let i = 0; i < els.length; i++) {
            add_element(list_addr, els[i]);
        }
        const list = this.read_list(list_addr);
        const flag = true;
        for(let i = 0; i < els.length; i++) {
            add_element(list_addr, els[i]);
            if(list[i] !== els[i])
                flag = false;
        }
        this.test(flag, true);
    }
}

new Test_find_free();
new Test_check_free_space();
new Test_malloc();
new Test_create_list();
new Test_add_element();
new Test_is_list_empty();
new Test_find_last_element();
new Test_integration();
