import Test  from "./Test.js";
import { SIZE, DELIMETERS } from "./consts.js";


class Test_Test extends Test {
    get_init_memory_layout() {
        return [
            DELIMETERS.list_start,
            DELIMETERS.list_end,
            4 * SIZE.i32,
            DELIMETERS.null,
            DELIMETERS.type_object,
            17 * SIZE.i32,
            9 * SIZE.i32,
            DELIMETERS.null,
            DELIMETERS.null,
            DELIMETERS.type_i32,
            23,
            12 * SIZE.i32,
            DELIMETERS.type_object,
            22 * SIZE.i32,
            DELIMETERS.list_end,
            DELIMETERS.null,
            DELIMETERS.null,
            DELIMETERS.list_start,
            DELIMETERS.list_end,
            DELIMETERS.list_end,
            DELIMETERS.null,
            DELIMETERS.null,
            DELIMETERS.list_start,
            DELIMETERS.list_end,
            DELIMETERS.list_end,
            DELIMETERS.null,
        ];
    }

    get_patch1() {
        return [
            [6, 12 * SIZE.i32],
            [9, DELIMETERS.null],
            [10, DELIMETERS.null],
            [11, DELIMETERS.null],
        ];
    }

    get_target_memory_layout() {
        return [
            DELIMETERS.list_start,
            DELIMETERS.list_end,
            4 * SIZE.i32,
            DELIMETERS.null,
            DELIMETERS.type_object,
            17 * SIZE.i32,
            12 * SIZE.i32,
            DELIMETERS.null,
            DELIMETERS.null,
            DELIMETERS.null,
            DELIMETERS.null,
            DELIMETERS.null,
            DELIMETERS.type_object,
            22 * SIZE.i32,
            DELIMETERS.list_end,
            DELIMETERS.null,
            DELIMETERS.null,
            DELIMETERS.list_start,
            DELIMETERS.list_end,
            DELIMETERS.list_end,
            DELIMETERS.null,
            DELIMETERS.null,
            DELIMETERS.list_start,
            DELIMETERS.list_end,
            DELIMETERS.list_end,
            DELIMETERS.null,
        ];
    }
    test_suite() {
        const result = this.patch_mem(this.get_init_memory_layout(), this.get_patch1());
        this.test(JSON.stringify(result), JSON.stringify(this.get_target_memory_layout()));
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


class Test_car_cdr_get_type extends Test {
    init_mem(mem) {
        this.mem_quick_init(mem, [10, 10, 20]);
    }

    test_suite(exports) {
        const { create_list_el, car_addr, cdr_addr, car, cdr, get_type } = exports;
        const [type, value, next_addr] = [1, 2, 3];
        const el_addr = create_list_el(type, value, next_addr);

        this.test(car_addr(el_addr), el_addr + SIZE.i32);
        this.test(cdr_addr(el_addr), el_addr + 2 * SIZE.i32);
        this.test(car(el_addr), value);
        this.test(cdr(el_addr), next_addr);
        this.test(get_type(el_addr), type);
    }
}


class Test_get_list_length extends Test {
    init_mem(mem) {
        this.mem_quick_init(mem, [10, 10, 20]);
    }

    test_suite(exports) {
        const { create_list, add_element, get_list_length } = exports;
        const list_p = create_list();
        add_element(list_p, 1, DELIMETERS.type_i32);
        add_element(list_p, 1, DELIMETERS.type_i32);

        this.test(get_list_length(list_p), 2);
    }
}


class Test_find_value_in_alist_from_key extends Test {
    init_mem(mem) {
        this.mem_quick_init(mem, [10, 10, 20]);
    }

    setup_rc_table(exports) {
        const {
            add_element,
            create_list,
            car,
            find_value_in_alist_from_key,
        } = exports;
        const sublist1_addr = create_list();
        const [key1, value1] = [1, 2];
        const [key2, value2] = [3, 4];
        add_element(sublist1_addr, key1, DELIMETERS.type_i32);
        add_element(sublist1_addr, value1, DELIMETERS.type_i32);
        const sublist2_addr = create_list();
        add_element(sublist2_addr, key2, DELIMETERS.type_i32);
        add_element(sublist2_addr, value2, DELIMETERS.type_i32);
        const alist_addr = create_list();
        add_element(alist_addr, sublist1_addr, DELIMETERS.type_object);
        add_element(alist_addr, sublist2_addr, DELIMETERS.type_object);
        return [alist_addr, key1, value1, key2, value2];
    }

    test_suite(exports) {
        const {
            car,
            find_value_in_alist_from_key,
        } = exports;

        const [alist_addr, key1, value1, key2, value2] = this.setup_rc_table(exports);
        this.test(
            car(find_value_in_alist_from_key(alist_addr, key1)),
            value1,
        );
        this.test(
            car(find_value_in_alist_from_key(alist_addr, key2)),
            value2,
        );
    }
}

class Test_increase_rc extends Test_find_value_in_alist_from_key {
    init_mem(mem) {
        this.mem_quick_init(mem, [10, 10, 20]);
    }

    test_suite(exports) {
        const {
            car,
            find_value_in_alist_from_key,
            increase_rc,
            decrease_rc,
        } = exports;

        const [alist_addr, key1, value1, key2, value2] = this.setup_rc_table(exports);

        decrease_rc(alist_addr, key1);
        increase_rc(alist_addr, key2);

        this.test(
            car(find_value_in_alist_from_key(alist_addr, key1)),
            value1 - 1,
        );
        this.test(
            car(find_value_in_alist_from_key(alist_addr, key2)),
            value2 + 1,
        );
    }
}

class Test_create_gc_list extends Test {
    init_mem(mem) {
        this.mem_quick_init(mem, [10, 10, 20], 100);
    }

    test_suite(exports) {
        const {
            create_list,
            create_gc_list,
            car,
            cdr,
            find_value_in_alist_from_key,
        } = exports;

        const rc_table = create_list();
        const gc_list = create_gc_list(rc_table);

        this.test(
            car(find_value_in_alist_from_key(rc_table, gc_list)),
            0,
        );
        this.test(cdr(gc_list), DELIMETERS.list_end);
    }
}


class Test_create_gc_list_el extends Test {
    init_mem(mem) {
        this.mem_quick_init(mem, [10, 10, 20], 100);
    }

    test_suite(exports) {
        const {
            create_list,
            create_gc_list_el,
            car,
            find_value_in_alist_from_key,
        } = exports;

        const rc_table = create_list();

        const [type, value, next_addr] = [1, 2, 3];
        const gc_list_el = create_gc_list_el(
            rc_table,
            type,
            value,
            next_addr,
        );

        this.test(
            car(find_value_in_alist_from_key(rc_table, gc_list_el)),
            0,
        );

        this.test(car(gc_list_el), value);
    }
}

class Test_free_list_el extends Test {
    init_mem(mem) {
        this.mem_quick_init(mem, [10, 10, 20], 100);
    }

    test_suite(exports) {
        const {
            create_list_el,
            free_list_el,
            car,
            cdr,
            get_type,
        } = exports;

        const [type, value, next_addr] = [1, 2, 3];
        const list_el_addr = create_list_el(type, value, next_addr);

        this.test(free_list_el(list_el_addr), next_addr);
        this.test(get_type(list_el_addr), DELIMETERS.null);
        this.test(car(list_el_addr), DELIMETERS.null);
        this.test(cdr(list_el_addr), DELIMETERS.null);
    }
}


class Test_free_gc_list_el extends Test {
    init_mem(mem) {
        this.mem_quick_init(mem, [10, 10, 20], 100);
    }

    test_suite(exports) {
        const {
            create_list,
            create_gc_list_el,
            free_gc_list_el,
            car,
            cdr,
            get_type,
            increase_rc,
            find_value_in_alist_from_key,
            add_to_rc_tab,
        } = exports;

        const rc_table = create_list();
        const [type, value, next_addr] = [1, 2, 3];
        const list_el_addr = create_gc_list_el(
            rc_table,
            type,
            value,
            next_addr,
        );

        increase_rc(rc_table, list_el_addr);
        this.test(
            car(find_value_in_alist_from_key(rc_table, list_el_addr)),
            1,
        );
        this.test(
            free_gc_list_el(rc_table, list_el_addr),
            next_addr
        );
        this.test(
            car(find_value_in_alist_from_key(rc_table, list_el_addr)),
            0,
        );
    }
}

class Test_free_gc_list extends Test {
    init_mem(mem) {
        this.mem_quick_init(mem, [10, 10, 20], 100);


        const spec = this.get_init_memory_layout();
        const i32 = new Uint32Array(mem.buffer);
        for(let i = 0; i < 100; i++) {
            i32[i] = DELIMETERS.null;
        }
        for(let i = 0; i < spec.length; i++) {
            i32[i] = spec[i];
        }
    }

    get_init_memory_layout() {
        return [
            DELIMETERS.list_start,
            DELIMETERS.list_end,
            4 * SIZE.i32,
            DELIMETERS.null,
            DELIMETERS.type_object,
            14 * SIZE.i32,
            9 * SIZE.i32,
            DELIMETERS.null,
            DELIMETERS.null,
            DELIMETERS.type_object,
            23 * SIZE.i32,
            DELIMETERS.list_end,
            DELIMETERS.null,
            DELIMETERS.null,
            DELIMETERS.list_start,
            DELIMETERS.list_end,
            18 * SIZE.i32,
            DELIMETERS.null,
            DELIMETERS.type_i32,
            15,
            DELIMETERS.list_end,
            DELIMETERS.null,
            DELIMETERS.null,
            DELIMETERS.list_start,
            DELIMETERS.list_end,
            27 * SIZE.i32,
            DELIMETERS.null,
            DELIMETERS.type_i32,
            15,
            DELIMETERS.list_end,
        ];
    }

    get_target_memory_layout() {
        return [
            DELIMETERS.null,
            DELIMETERS.null,
            DELIMETERS.null,
            DELIMETERS.null,
            DELIMETERS.null,
            DELIMETERS.null,
            DELIMETERS.null,
            DELIMETERS.null,
            DELIMETERS.null,
            DELIMETERS.null,
            DELIMETERS.null,
            DELIMETERS.null,
            DELIMETERS.null,
            DELIMETERS.null,
            DELIMETERS.list_start,
            DELIMETERS.list_end,
            18 * SIZE.i32,
            DELIMETERS.null,
            DELIMETERS.type_i32,
            15,
            DELIMETERS.list_end,
            DELIMETERS.null,
            DELIMETERS.null,
            DELIMETERS.list_start,
            DELIMETERS.list_end,
            27 * SIZE.i32,
            DELIMETERS.null,
            DELIMETERS.type_i32,
            15,
            DELIMETERS.list_end,
        ];
    }

    test_find_position_in_alist_from_key_addr(exports) {
        const {
            create_list,
            create_gc_list,
            find_position_in_alist_from_key_addr,
        } = exports;

        const rc_tab = create_list();
        const gc_list1 = create_gc_list(rc_tab);
        const gc_list2 = create_gc_list(rc_tab);
        this.test(find_position_in_alist_from_key_addr(rc_tab, gc_list1), 1);
        this.test(find_position_in_alist_from_key_addr(rc_tab, gc_list2), 2);
    }

    test_suite(exports) {
        this.test_find_position_in_alist_from_key_addr(exports);
        const {
            create_list,
            free_gc_list,
            increase_rc,
            car,
            find_value_in_alist_from_key,
            add_to_rc_tab,
        } = exports;

        const rc_table = create_list();

        const gc_sublist1 = 14 * SIZE.i32;
        add_to_rc_tab(rc_table, gc_sublist1);
        increase_rc(rc_table, gc_sublist1);
        increase_rc(rc_table, gc_sublist1);
        const gc_sublist2 = 23 * SIZE.i32;
        add_to_rc_tab(rc_table, gc_sublist2);
        increase_rc(rc_table, gc_sublist2);

        const gc_list = 0;
        free_gc_list(rc_table, gc_list);

        const i32 = new Uint32Array(this.memory.buffer);
        const target_memory_layout = this.get_target_memory_layout();
        for(let i = 0; i < target_memory_layout.length; i++)
            this.test(i32[i], target_memory_layout[i]);


class Test_add_gc_element extends Test {
    init_mem(mem) {
        this.mem_quick_init(mem, [10, 10, 20], 100);


        const spec = this.get_init_memory_layout();
        const i32 = new Uint32Array(mem.buffer);
        for(let i = 0; i < 1000; i++) {
            i32[i] = DELIMETERS.null;
        }
    }

    get_init_memory_layout() {}

    test_suite(exports) {
        const {
            create_list,
            create_gc_list,
            create_gc_list_el,
            free_gc_list,
            increase_rc,
            car,
            cdr,
            find_value_in_alist_from_key,
            add_to_rc_tab,
            add_gc_element,
            find_nth_element,
        } = exports;

        const rc_tab = create_list();

        const gc_list = create_gc_list(rc_tab);

        add_gc_element(rc_tab, gc_list, 1, DELIMETERS.type_i32);

        const gc_sublist = create_gc_list(rc_tab);
        add_gc_element(rc_tab, gc_list, gc_sublist, DELIMETERS.type_object);

        // check that gc_list is in the rc_tab
        this.test(this.read_list(rc_tab)[0][0], gc_list);
        // check that gc_list_el is in the rc_tab
        this.test(
            this.read_list(rc_tab)[1][0],
            cdr(find_nth_element(gc_list, 0))
        );
        // gc_list has zero references pointing to it
        this.test(this.read_list(rc_tab)[0][1], 0);
        // first element has 1 reference to it (the gc_list head)
        this.test(this.read_list(rc_tab)[1][1], 1);
        // check that sublist is in the rc_tab
        this.test(
            this.read_list(rc_tab)[2][0],
            gc_sublist
        );
        // gc_sublist has one reference pointing to it
        this.test(this.read_list(rc_tab)[2][1], 1);
    }
}

class Test_garbage_collect extends Test_free_gc_list {
    get_target_memory_layout() {
        return [
            DELIMETERS.null,
            DELIMETERS.null,
            DELIMETERS.null,
            DELIMETERS.null,
            DELIMETERS.null,
            DELIMETERS.null,
            DELIMETERS.null,
            DELIMETERS.null,
            DELIMETERS.null,
            DELIMETERS.null,
            DELIMETERS.null,
            DELIMETERS.null,
            DELIMETERS.null,
            DELIMETERS.null,
            DELIMETERS.list_start,
            DELIMETERS.list_end,
            18 * SIZE.i32,
            DELIMETERS.null,
            DELIMETERS.type_i32,
            15,
            DELIMETERS.list_end,
            DELIMETERS.null,
            DELIMETERS.null,
            DELIMETERS.null,
            DELIMETERS.null,
            DELIMETERS.null,
            DELIMETERS.null,
            DELIMETERS.null,
            DELIMETERS.null,
            DELIMETERS.null,
        ];
    }

    test_suite(exports) {
        const {
            create_list,
            garbage_collect,
            increase_rc,
            car,
            find_value_in_alist_from_key,
            add_to_rc_tab,
        } = exports;

        const rc_table = create_list();

        const gc_list = 0;
        add_to_rc_tab(rc_table, gc_list);
        const gc_sublist1 = 14 * SIZE.i32;
        add_to_rc_tab(rc_table, gc_sublist1);
        increase_rc(rc_table, gc_sublist1);
        increase_rc(rc_table, gc_sublist1);
        const gc_sublist2 = 23 * SIZE.i32;
        add_to_rc_tab(rc_table, gc_sublist2);
        increase_rc(rc_table, gc_sublist2);



        garbage_collect(rc_table);

        const i32 = new Uint32Array(this.memory.buffer);
        const target_memory_layout = this.get_target_memory_layout();
        for(let i = 0; i < target_memory_layout.length; i++)
            this.test(i32[i], target_memory_layout[i]);

        this.test(
            car(find_value_in_alist_from_key(rc_table, gc_sublist1)),
            1,
        );
        this.test(
            car(find_value_in_alist_from_key(rc_table, gc_sublist2)),
            0,
        );
    }
}


class Test_clean_rc_tab extends Test_free_gc_list {
    get_target_memory_layout() {
        return [
            DELIMETERS.null,
            DELIMETERS.null,
            DELIMETERS.null,
            DELIMETERS.null,
            DELIMETERS.null,
            DELIMETERS.null,
        ];
    }

    test_suite(exports) {
        const {
            create_list,
            increase_rc,
            decrease_rc,
            add_to_rc_tab,
            clean_rc_tab,
        } = exports;

        const rc_table = create_list();

        const list1 = create_list();
        add_to_rc_tab(rc_table, list1);
        const list2 = create_list();
        add_to_rc_tab(rc_table, list2);
        increase_rc(rc_table, list2);

        this.test(JSON.stringify(this.read_list(rc_table)), `[[${list1},0],[${list2},1]]`);
        clean_rc_tab(rc_table);
        this.test(JSON.stringify(this.read_list(rc_table)), `[[${list2},1]]`);
        decrease_rc(rc_table, list2);
        clean_rc_tab(rc_table);
        this.test(JSON.stringify(this.read_list(rc_table)), `[]`);
    }
}


class Test_remove_nth_list_el extends Test {
    init_mem(mem) {
        const spec = this.get_init_memory_layout();
        this.mem_length = spec.length;

        const i32 = new Uint32Array(mem.buffer);
        for(let i = 0; i < this.mem_length; i++) {
            i32[i] = spec[i];
        }
    }

    get_init_memory_layout() {
        return [
            DELIMETERS.list_start,
            DELIMETERS.list_end,
            4 * SIZE.i32,
            DELIMETERS.null,
            DELIMETERS.type_object,
            17 * SIZE.i32,
            9 * SIZE.i32,
            DELIMETERS.null,
            DELIMETERS.null,
            DELIMETERS.type_i32,
            23,
            12 * SIZE.i32,
            DELIMETERS.type_object,
            22 * SIZE.i32,
            DELIMETERS.list_end,
            DELIMETERS.null,
            DELIMETERS.null,
            DELIMETERS.list_start,
            DELIMETERS.list_end,
            DELIMETERS.list_end,
            DELIMETERS.null,
            DELIMETERS.null,
            DELIMETERS.list_start,
            DELIMETERS.list_end,
            DELIMETERS.list_end,
            DELIMETERS.null,
        ];
    }

    get_patch3() {
        return [
            [2, DELIMETERS.list_end],
            [12, DELIMETERS.null],
            [13, DELIMETERS.null],
            [14, DELIMETERS.null],
        ];
    }

    get_patch2() {
        return [
            [2, 12 * SIZE.i32],
            [4, DELIMETERS.null],
            [5, DELIMETERS.null],
            [6, DELIMETERS.null],
        ];
    }

    get_patch1() {
        return [
            [6, 12 * SIZE.i32],
            [9, DELIMETERS.null],
            [10, DELIMETERS.null],
            [11, DELIMETERS.null],
        ];
    }

    test_suite(exports) {
        const {
            remove_nth_list_el,
            car,
            find_value_in_alist_from_key,
        } = exports;

        const list = 0;
        const result1 = remove_nth_list_el(list, 2);
        this.test(result1, DELIMETERS.null);

        const i32 = new Uint32Array(this.memory.buffer);
        const target1_memory_layout = this.patch_mem(i32, this.get_patch1());
        for(let i = 0; i < this.mem_length; i++)
            this.test(i32[i], target1_memory_layout[i]);


        const result2 = remove_nth_list_el(list, 1);
        this.test(result2, 17 * SIZE.i32);

        const target2_memory_layout = this.patch_mem(target1_memory_layout, this.get_patch2());
        for(let i = 0; i < this.mem_length; i++)
            this.test(i32[i], target2_memory_layout[i]);

        const result3 = remove_nth_list_el(list, 1);
        this.test(result3, 22 * SIZE.i32);

        const target3_memory_layout = this.patch_mem(target2_memory_layout, this.get_patch3());
        for(let i = 0; i < this.mem_length; i++)
            this.test(i32[i], target3_memory_layout[i]);
    }
}

class Test_free_flat_list extends Test {
    init_mem(mem) {
        const spec = this.get_init_memory_layout();
        this.mem_length = spec.length;

        const i32 = new Uint32Array(mem.buffer);
        for(let i = 0; i < this.mem_length; i++) {
            i32[i] = spec[i];
        }
    }

    get_init_memory_layout() {
        return [
            DELIMETERS.list_start,
            DELIMETERS.list_end,
            4 * SIZE.i32,
            DELIMETERS.null,
            DELIMETERS.type_object,
            17 * SIZE.i32,
            9 * SIZE.i32,
            DELIMETERS.null,
            DELIMETERS.null,
            DELIMETERS.type_i32,
            23,
            12 * SIZE.i32,
            DELIMETERS.type_object,
            22 * SIZE.i32,
            DELIMETERS.list_end,
            DELIMETERS.null,
        ];
    }

    get_patch() {
        return [0, 1, 2, 4, 5, 6, 9, 10, 11, 12, 13, 14]
            .map(e => [e, DELIMETERS.null]);
    }

    test_suite(exports) {
        const { free_flat_list } = exports;

        const list = 0;
        free_flat_list(list);

        const i32 = new Uint32Array(this.memory.buffer);
        const target_memory_layout = this.patch_mem(i32, this.get_patch());
        for(let i = 0; i < this.mem_length; i++)
            this.test(i32[i], target_memory_layout[i]);
    }
}

new Test_free_gc_list("free_gc_list");
new Test_garbage_collect("garbage_collect");
new Test_create_gc_list("create_gc_list");
new Test_free("free");
new Test_free_list_el("free_list_el");
new Test_increase_rc("increase_decrease_rc");
new Test_find_value_in_alist_from_key("find_value_in_alist_from_key");
new Test_add_to_rc_tab("add_to_rc_tab");
new Test_car_cdr_get_type("car, cdr, get_type");
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
new Test_clean_rc_tab("Clean rc tab");
new Test_free_flat_list("Free flat list");
new Test_Test("Base test class");
new Test_remove_nth_list_el("remove_nth_list_el");
new Test_get_list_length("get list length");
new Test_create_gc_list_el("gc_list_el")
new Test_free_gc_list_el("free_gc_list_el");
new Test_add_gc_element("add gc element");
