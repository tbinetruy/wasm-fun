(module
 (import "js" "mem" (memory 1))
 (global $size_i32 (import "globals" "size_int") i32)
 (global $list_start_char (import "globals" "list_start_char") i32)
 (global $list_end_char (import "globals" "list_end_char") i32)
 (global $null_char (import "globals" "null_char") i32)
 (global $type_i32 (import "globals" "type_int") i32)

 (func $check_free_space (param $start i32) (param $length i32) (result i32)
       (local $i i32)
       (local $return i32)

       (get_local $start)
       (set_local $i)
       (set_local $return (i32.const 0))

       (block $iter
         (loop
          (get_local $i)
          (i32.load)
          (get_global $null_char)
          (i32.eq)
          (if
              (then
               (set_local $return (i32.const 1)))
              (else
               (set_local $return (i32.const 0))))


          (get_local $i)
          (get_local $length)
          (get_local $start)
          (i32.add)
          (i32.eq)
          (get_local $i)
          (i32.load)
          (get_global $null_char)
          (i32.ne)
          (i32.or)
          (br_if $iter)

          (get_global $size_i32)
          (get_local $i)
          (i32.add)
          (set_local $i)

          (br 0)))
       get_local $return)

 (func $find_free (param $i i32) (result i32)
       (block $iter
         (loop
           (get_local $i)
           (i32.load)
           (get_global $null_char)
           (i32.eq)
           (br_if $iter)

           (get_global $size_i32)
           (get_local $i)
           (i32.add)
           (set_local $i)
           (br 0)))
       (get_local $i))

 (func $malloc (param $length i32) (result i32)
       (local $i i32)
       (local $return i32)

       (set_local $i (i32.const 0))
       (set_local $return (i32.const -1))

       (block $iter
         (loop
          (get_local $i)
          (call $find_free)
          (set_local $return)
          (get_local $return)
          (get_local $length)
          (call $check_free_space)
          (br_if $iter)

          (set_local $return (i32.const -1))

          (get_global $size_i32)
          (get_local $i)
          (i32.add)
          (set_local $i)

          (br 0)))
       (get_local $return))

 (func $create_list_el (param $type i32)
                       (param $value i32)
                       (param $next_addr i32)
                       (result i32)
       (local $pointer i32)

       (i32.const 3)
       (get_global $size_i32)
       (i32.mul)
       (call $malloc)
       (set_local $pointer)

       (get_local $pointer)
       (get_local $type)
       (i32.store)

       (get_local $pointer)
       (get_global $size_i32)
       (i32.add)
       (get_local $value)
       (i32.store)

       (get_local $pointer)
       (get_global $size_i32)
       (i32.const 2)
       (i32.mul)
       (i32.add)
       (get_local $next_addr)
       (i32.store)

       (get_local $pointer))

 (func $create_list (result i32)
       (get_global $list_start_char)
       (get_global $list_end_char)
       (get_global $list_end_char)
       (call $create_list_el))

 (func $is_list_empty (param $list_addr i32) (result i32)
       (local $return i32)
       (get_local $list_addr)
       (get_global $size_i32)
       (i32.const 2)
       (i32.mul)
       (i32.add)
       (i32.load)
       (get_global $list_end_char)
       (i32.eq)
       (if
           (then
            (set_local $return (i32.const 1)))
           (else
            (set_local $return (i32.const 0))))
       (get_local $return))

 (func $find_last_element (param $list_addr i32) (result i32)
       (local $return i32)
       (local $pointer i32)
       (set_local $pointer (get_local $list_addr))
       (get_local $list_addr)
       (call $is_list_empty)
       (if
           (then
            (get_local $list_addr)
            (set_local $return))
           (else
            (block $iter
              (loop
               (get_local $pointer)
               (set_local $return)

               (get_local $pointer)
               (get_global $size_i32)
               (i32.const 2)
               (i32.mul)
               (i32.add)
               (i32.load)
               (set_local $pointer)

               (get_local $pointer)
               (get_global $list_end_char)
               (i32.eq)
               (br_if $iter)

               (br 0)))))
       (get_local $return))

 (func $add_element (param $list_addr i32)
                    (param $el i32)
                    (param $el_type i32)
                    (result i32)
       (local $pointer i32)

       (get_local $el_type)
       (get_local $el)
       (get_global $list_end_char)
       (call $create_list_el)
       (set_local $pointer)

       (get_local $list_addr)
       (call $find_last_element)
       (get_global $size_i32)
       (i32.const 2)
       (i32.mul)
       (i32.add)
       (get_local $pointer)
       (i32.store)

       (get_local $list_addr))

 (export "check_free_space" (func $check_free_space))
 (export "find_free" (func $find_free))
 (export "create_list_el" (func $create_list_el))
 (export "malloc" (func $malloc))
 (export "create_list" (func $create_list))
 (export "is_list_empty" (func $is_list_empty))
 (export "find_last_element" (func $find_last_element))
 (export "add_element" (func $add_element)))
