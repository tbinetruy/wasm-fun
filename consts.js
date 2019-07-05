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

const TOKEN = {
    function: 'func',
    declare_local_var: 'let',
    print: 'print',
    create_list: 'list',
    create_string: 'string',
    print_string: 'print_string',
    read_local_var: 'read',
    block_declaration: 'progn',
};

export {
    SIZE, DELIMETERS, TOKEN,
};
