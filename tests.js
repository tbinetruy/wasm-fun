const SIZE = {
    i32: 4,
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

        const importObject = { js: { mem: memory } };
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
}


class Test_find_free extends Test {
    init_mem(mem) {
        var i32 = new Uint32Array(mem.buffer);
        this.c = 10;
        this.offset = 4;

        for (let i = 0; i < 2*this.c + this.offset; i++) {
            i32[i] = 0;
        }
        for (let i = 0; i < this.c; i++) {
            i32[i] = 1;
        }
        for (let i = this.c + this.offset; i < 2 * this.c + this.offset; i++) {
            i32[i] = 1;
        }
    }
    test_suite(exports) {
        const { find_free } = exports;
        this.test(find_free(0), 40);
        this.test(find_free(this.c - 9), 40);
        this.test(find_free(this.c), 40);
    }
}

class Test_check_free_space extends Test {
    init_mem(mem) {
        this.c = 10;
        this.d = 20;
        this.offset = 4;

        var i32 = new Uint32Array(mem.buffer);
        for (let i = 0; i < this.d + this.offset; i++) {
            i32[i] = 0;
        }
        for (let i = 0; i < this.c; i++) {
            i32[i] = 1;
        }
        for (let i = (this.c + 1) + this.offset; i < this.d; i++) {
            i32[i] = 1;
        }
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

new Test_find_free();
new Test_check_free_space();
