const SIZE = {
    i32: 4,
};

const DELIMETERS = {
    list_start: 1000,
    list_end: 2000,
    null: 3000,
    type_i32: 1010,
    type_object: 2010,
};

class Test {
    constructor(docstring) {
        this.test = this.test.bind(this);
        this.load_wasm = this.load_wasm.bind(this);
        this.test_suite = this.test_suite.bind(this);
        this.init_mem = this.init_mem.bind(this);
        this.get_mem = this.get_mem.bind(this);

        this.docstring = docstring;
        this.load_wasm();
    }

    read_list(addr) {
        const list = [];
        addr = addr / SIZE.i32;

        const i32 = new Uint32Array(this.memory.buffer);

        const next_addr = i32[addr + 2];
        if (next_addr === DELIMETERS.list_end)
            return list;

        addr = next_addr / SIZE.i32;
        do {
            const type = i32[addr];
            const value = i32[addr + 1];
            const next_addr = i32[addr + 2];

            if (type === DELIMETERS.type_object)
                list.push(this.read_list(value));
            else
                list.push(value);

            if (next_addr === DELIMETERS.list_end) {
                return list;
            }
            addr = next_addr / SIZE.i32;
        } while(1);

        return -1;
    }

    debug() {
        window.mem = new Uint32Array(this.memory.buffer);
        console.log("============");
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
            type_int: DELIMETERS.type_i32,
            type_object: DELIMETERS.type_object,
        };
        const importObject = { js: { mem: memory }, globals };
        const response = await fetch("linked_list.wasm");
        const buffer = await response.arrayBuffer();
        const obj = await WebAssembly.instantiate(buffer, importObject);

        console.log("============ " + this.docstring + " ============");
        this.test_suite(obj.instance.exports);
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

class Test_create_list_el extends Test {
    init_mem(mem) {
        this.memory = mem;

        this.mem_quick_init(mem, [10, 100, 300]);
    }

    test_suite(exports) {
        const { create_list_el } = exports;
        const value = 10;
        const list_el = create_list_el(
            DELIMETERS.type_i32,
            value,
            DELIMETERS.list_end,
        ) / SIZE.i32;
        this.test(list_el, this.c);

        const i32 = new Uint32Array(this.memory.buffer);
        this.test(i32[list_el], DELIMETERS.type_i32);
        this.test(i32[list_el + 1], value);
        this.test(i32[list_el + 2], DELIMETERS.list_end);
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

        const i32 = new Uint32Array(this.memory.buffer);
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
            0,
            DELIMETERS.list_start,
            DELIMETERS.list_end,
            8,
            DELIMETERS.type_i32,
            1,
            DELIMETERS.list_end,
        ];

        const i32 = new Uint32Array(mem.buffer);
        for(let i = 0; i < spec.length; i++) {
            i32[i] = spec[i];
        }
    }

    test_suite(exports) {
        const { create_list, is_list_empty } = exports;
        const list1_addr = 0;
        const list2_addr = 5 * SIZE.i32;
        this.test(is_list_empty(list1_addr), 1);
        this.test(is_list_empty(list2_addr), 0);
    }
}


class Test_find_nth_element extends Test {
    init_mem(mem) {
        const spec = [
            DELIMETERS.list_start, // cell type
            DELIMETERS.list_end,   // always list_end for list first cell
            4 * SIZE.i32,          // next address
            DELIMETERS.null,
            DELIMETERS.type_i32,   // cell type
            15,                    // value
            10 * SIZE.i32,         // next address
            DELIMETERS.null,
            DELIMETERS.null,
            DELIMETERS.null,
            DELIMETERS.type_i32,   // cell type
            15,                    // value
            DELIMETERS.list_end,   // list ends
            DELIMETERS.null,
            DELIMETERS.null,
            DELIMETERS.null,
        ];

        const i32 = new Uint32Array(mem.buffer);
        for(let i = 0; i < spec.length; i++) {
            i32[i] = spec[i];
        }
    }

    test_suite(exports) {
        const { find_nth_element } = exports;
        const list_addr = 0;
        this.test(find_nth_element(list_addr, 0), 0);
        this.test(find_nth_element(list_addr, 1), 4 * SIZE.i32);
        this.test(find_nth_element(list_addr, 2), 10 * SIZE.i32);
        this.test(find_nth_element(list_addr, 3), 10 * SIZE.i32);
    }
}

class Test_find_last_element extends Test {
    init_mem(mem) {
        const spec = [
            DELIMETERS.list_start, // cell type
            DELIMETERS.list_end,   // always list_end for list first cell
            4 * SIZE.i32,          // next address
            DELIMETERS.null,
            DELIMETERS.type_i32,   // cell type
            15,                    // value
            10 * SIZE.i32,         // next address
            DELIMETERS.null,
            DELIMETERS.null,
            DELIMETERS.null,
            DELIMETERS.type_i32,   // cell type
            15,                    // value
            DELIMETERS.list_end,   // list ends
            DELIMETERS.null,
            DELIMETERS.null,
            DELIMETERS.null,
        ];

        const i32 = new Uint32Array(mem.buffer);
        for(let i = 0; i < spec.length; i++) {
            i32[i] = spec[i];
        }
    }

    test_suite(exports) {
        const { find_last_element } = exports;
        const list_addr = 0;
        this.test(find_last_element(list_addr), 10 * SIZE.i32);
    }
}

class Test_add_element extends Test {
    init_mem(mem) {
        this.memory = mem;

        this.mem_quick_init(mem, [10, 1, 20], 5);
    }

    test_suite(exports) {
        const { create_list, add_element } = exports;
        const list_addr = create_list();
        const el1 = 15;
        add_element(list_addr, el1, DELIMETERS.type_i32);

        const i32 = new Uint32Array(this.memory.buffer);
        const el1_addr = i32[list_addr / SIZE.i32 + 2];

        this.test(i32[list_addr / SIZE.i32], DELIMETERS.list_start);
        this.test(i32[list_addr / SIZE.i32 + 1], DELIMETERS.list_end);
        this.test(i32[list_addr / SIZE.i32 + 2], el1_addr);

        this.test(i32[el1_addr / SIZE.i32], DELIMETERS.type_i32);
        this.test(i32[el1_addr / SIZE.i32 + 1], el1);
        this.test(i32[el1_addr / SIZE.i32 + 2], DELIMETERS.list_end);

        const el2 = 16;
        add_element(list_addr, el2, DELIMETERS.type_i32);
        const el2_addr = i32[el1_addr / SIZE.i32 + 2];

        this.test(i32[el1_addr / SIZE.i32 + 2], el2_addr);

        this.test(i32[el2_addr / SIZE.i32], DELIMETERS.type_i32);
        this.test(i32[el2_addr / SIZE.i32 + 1], el2);
        this.test(i32[el2_addr / SIZE.i32 + 2], DELIMETERS.list_end);

    }
}


class Test_concat extends Test {
    init_mem(mem) {
        this.mem_quick_init(mem, [10, 1, 20], 5);
    }

    test_suite(exports) {
        const { create_list, add_element, concat } = exports;
        let els1 = [1, 2, 5, 4, 3, 6, 7];
        let els2 = [10, 20, 50, 40, 30, 60, 70];

        const list_addr1 = create_list();
        for(let i = 0; i < els1.length; i++) {
            add_element(list_addr1, els1[i], DELIMETERS.type_i32);
        }

        const list_addr2 = create_list();
        for(let i = 0; i < els2.length; i++) {
            add_element(list_addr2, els2[i], DELIMETERS.type_i32);
        }

        let list1 = this.read_list(list_addr1);
        let list2 = this.read_list(list_addr2);
        this.test(JSON.stringify(els1), JSON.stringify(list1));
        this.test(JSON.stringify(els2), JSON.stringify(list2));

        concat(list_addr1, list_addr2);

        list1 = this.read_list(list_addr1);
        list2 = this.read_list(list_addr2);
        this.test(JSON.stringify(els1.concat(els2)), JSON.stringify(list1));
        this.test(JSON.stringify(els2), JSON.stringify(list2));
    }
}


class Test_nested extends Test {
    init_mem(mem) {
        this.memory = mem;

        const i32 = new Uint32Array(mem.buffer);

        for (let i = 0; i < 2000; i++) {
            i32[i] = DELIMETERS.null;
        }
        for (let i = 0; i < 10; i++) {
            i32[i] = 1;
        }
    }

    test_suite(exports) {
        const { create_list, add_element } = exports;
        const els = [1, 2, 5, 4, 3, 6, 7];

        const list_addr = create_list();
        for(let i = 0; i < els.length; i++) {
            add_element(list_addr, els[i], DELIMETERS.type_i32);
        }

        const list_addr2 = create_list();
        for(let i = 0; i < els.length; i++) {
            add_element(list_addr2, els[i], DELIMETERS.type_i32);
        }
        add_element(list_addr2, list_addr, DELIMETERS.type_object);
        for(let i = 0; i < els.length; i++) {
            add_element(list_addr2, els[i], DELIMETERS.type_i32);
        }

        const list = this.read_list(list_addr);
        const list2 = this.read_list(list_addr2);

        this.test(JSON.stringify(els), JSON.stringify(list));
        this.test(JSON.stringify(els.concat([els]).concat(els)), JSON.stringify(list2));
    }
}

new Test_find_free("find_free");
new Test_check_free_space("check_free_space");
new Test_malloc("malloc");
new Test_create_list_el("create_list_el");
new Test_create_list("create_list");
new Test_add_element("add_element");
new Test_is_list_empty("is_list_empty");
new Test_find_last_element("find_last_element");
new Test_find_nth_element("find_nth_element");
new Test_nested("nested lists");
new Test_concat("concat");

class Test_free extends Test {
    init_mem(mem) {
        this.mem_quick_init(mem, [10, 10, 20]);
    }

    test_suite(exports) {
        const { free } = exports;

        const start_addr = 2;
        const c = 3;
        free(start_addr * SIZE.i32, c * SIZE.i32);

        const i32 = new Uint32Array(this.memory.buffer);

        this.test(i32[start_addr - 1], 1);
        for(let i = 0; i < c; i++)
            this.test(i32[start_addr + i], DELIMETERS.null);
        this.test(i32[start_addr + c], 1);
    }
}


class Test_add_to_rc_tab extends Test {
    init_mem(mem) {
        this.mem_quick_init(mem, [10, 10, 20]);
    }

    test_suite(exports) {
        const { create_list, add_to_rc_tab, find_nth_element, car } = exports;
        const ref_count_tab_addr = create_list();
        const el_addr = 10 * SIZE.i32;
        add_to_rc_tab(ref_count_tab_addr, el_addr);

        const first_el_addr = car(find_nth_element(ref_count_tab_addr, 1));

        this.test(car(find_nth_element(first_el_addr, 1)), el_addr);
        this.test(car(find_nth_element(first_el_addr, 2)), 0);
    }
}

        console.log("foo");
        this.debug();
class Test_car_cdr_addr extends Test {
    init_mem(mem) {
        this.mem_quick_init(mem, [10, 10, 20]);
    }

    test_suite(exports) {
        const { create_list_el, car_addr, cdr_addr, car, cdr } = exports;
        const [type, value, next_addr] = [1, 2, 3];
        const el_addr = create_list_el(type, value, next_addr);

        this.test(car_addr(el_addr), el_addr + SIZE.i32);
        this.test(cdr_addr(el_addr), el_addr + 2 * SIZE.i32);
        this.test(car(el_addr), value);
        this.test(cdr(el_addr), next_addr);
    }
}

new Test_free("free");
new Test_add_to_rc_tab("add_to_rc_tab");
new Test_car_cdr_addr("car_addr and cd_addr");
