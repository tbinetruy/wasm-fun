import { SIZE, DELIMETERS, token_names } from "./consts.js";

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

function map_token_to_number(token) {
    for(let i = 0; i < token_names.length; i++) {
        if(token_names[i] === token)
            return i;
    }
    return -1;
}

export {
    read_list, map_token_to_number
}
