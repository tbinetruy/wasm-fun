(module
 (import "js" "mem" (memory 1))
 (global $size_i32 (import "globals" "size_int") i32)
 (global $list_start_char (import "globals" "list_start_char") i32)
 (global $list_end_char (import "globals" "list_end_char") i32)
 (global $null_char (import "globals" "null_char") i32)
 (global $type_i32 (import "globals" "type_int") i32)
 (global $type_object (import "globals" "type_object") i32)

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


 (func $find_nth_element (param $list_addr i32) (param $el_num i32) (result i32)
       (local $return i32)
       (local $pointer i32)
       (local $counter i32)
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
               (get_local $counter)
               (get_local $el_num)
               (i32.eq)
               (i32.or)
               (br_if $iter)

               (get_local $counter)
               (i32.const 1)
               (i32.add)
               (set_local $counter)

               (br 0)))))
       (get_local $return))

 (func $find_last_element (param $list_addr i32) (result i32)
       (get_local $list_addr)
       (get_global $list_end_char)
       (call $find_nth_element))

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

 (func $concat (param $listA_addr i32) (param $listB_addr i32) (result i32)
       (get_local $listA_addr)
       (call $find_last_element)
       (get_global $size_i32)
       (i32.const 2)
       (i32.mul)
       (i32.add)

       (get_local $listB_addr)
       (get_global $size_i32)
       (i32.const 2)
       (i32.mul)
       (i32.add)
       (i32.load)

       (i32.store)

       (get_local $listA_addr))

 (func $free (param $addr i32) (param $length i32)
       (local $pointer i32)
       (get_local $addr)
       (set_local $pointer)
       (block $iter
         (loop
          (get_local $pointer)
          (get_local $addr)
          (i32.sub)
          (get_local $length)
          (i32.ge_s)
          (br_if $iter)

          (get_local $pointer)
          (get_global $null_char)
          (i32.store)

          (get_local $pointer)
          (get_global $size_i32)
          (i32.add)
          (set_local $pointer)

          (br 0))))

 (func $add_to_rc_tab (param $tab_addr i32) (param $el_addr i32)
       (local $list_pointer i32)
       (call $create_list)
       (set_local $list_pointer)

       (get_local $list_pointer)
       (get_local $el_addr)
       (get_global $type_i32)
       (call $add_element)
       (drop)

       (get_local $list_pointer)
       (i32.const 0)
       (get_global $type_i32)
       (call $add_element)
       (drop)

       (get_local $tab_addr)
       (get_local $list_pointer)
       (get_global $type_object)
       (call $add_element)
       (drop))

 (func $get_type (param $el_addr i32) (result i32)
       (get_local $el_addr)
       (i32.load))

 (func $car_addr (param $el_addr i32) (result i32)
       (get_local $el_addr)
       (get_global $size_i32)
       (i32.add))

 (func $car (param $el_addr i32) (result i32)
       (get_local $el_addr)
       (call $car_addr)
       (i32.load))

 (func $cdr_addr (param $el_addr i32) (result i32)
       (get_local $el_addr)
       (get_global $size_i32)
       (i32.const 2)
       (i32.mul)
       (i32.add))

 (func $cdr (param $el_addr i32) (result i32)
       (get_local $el_addr)
       (call $cdr_addr)
       (i32.load))

 (func $find_value_in_alist_from_key (param $alist_addr i32) (param $key i32) (result i32)
       (local $counter i32)
       (local $pointer1 i32)
       (local $pointer2 i32)
       (local $return i32)
       (set_local $return (get_global $null_char))
       (set_local $counter (i32.const 1))
       (block $iter
         (loop
          (get_local $alist_addr)
          (get_local $counter)
          (call $find_nth_element)
          (set_local $pointer2)
          (get_local $pointer2)
          (call $car)
          (set_local $pointer1)
          (get_local $pointer1)
          (i32.const 1)
          (call $find_nth_element)
          (call $car)
          (get_local $key)
          (i32.eq)
          (if
              (then
               (get_local $pointer1)
               (i32.const 2)
               (call $find_nth_element)
               (set_local $return)))


          (get_local $pointer2)
          (call $cdr)
          (get_global $list_end_char)
          (i32.eq)
          (get_local $return)
          (get_global $null_char)
          (i32.ne)
          (i32.or)
          (br_if $iter)

          (get_local $counter)
          (i32.const 1)
          (i32.add)
          (set_local $counter)

          (br 0)))
       (get_local $return))

 (func $increase_rc (param $tab_addr i32) (param $addr i32)
       (local $pointer i32)
       (get_local $tab_addr)
       (get_local $addr)
       (call $find_value_in_alist_from_key)
       (set_local $pointer)
       (get_local $pointer)
       (call $car_addr)
       (get_local $pointer)
       (call $car)
       (i32.const 1)
       (i32.add)
       (i32.store))


 (func $decrease_rc (param $tab_addr i32) (param $addr i32)
       (local $pointer i32)
       (get_local $tab_addr)
       (get_local $addr)
       (call $find_value_in_alist_from_key)
       (set_local $pointer)
       (get_local $pointer)
       (call $car_addr)
       (get_local $pointer)
       (call $car)
       (i32.const 1)
       (i32.sub)
       (i32.store))

 (func $create_gc_list (param $tab_addr i32) (result i32)
       (local $pointer i32)
       (call $create_list)
       (set_local $pointer)

       (get_local $tab_addr)
       (get_local $pointer)
       (call $add_to_rc_tab)

       (get_local $pointer))

 (func $free_list_el (param $el_addr i32) (result i32)
       (local $pointer i32)
       (get_local $el_addr)
       (call $cdr)
       (set_local $pointer)

       (get_local $el_addr)
       (get_global $size_i32)
       (i32.const 3)
       (i32.mul)
       (call $free)

       (get_local $pointer))


 (func $free_gc_list (param $tab_addr i32) (param $list_addr i32)
       (local $pointer i32)
       (local $next_addr i32)
       (get_local $list_addr)
       (set_local $pointer)
       (block $iter
         (loop
          (get_local $pointer)
          (call $get_type)
          (get_global $type_object)
          (i32.eq)
          (if
              (then
               (get_local $tab_addr)
               (get_local $pointer)
               (call $car)
               (call $decrease_rc)))

          (get_local $pointer)
          (call $free_list_el)
          (set_local $next_addr)

          (get_local $next_addr)
          (get_global $list_end_char)
          (i32.eq)
          (br_if $iter)

          (get_local $next_addr)
          (set_local $pointer)

          (br 0))))

 (func $remove_nth_list_el (param $list_addr i32) (param $n i32) (result i32)
       (local $pointer i32)
       (local $next_addr i32)
       (local $return_value i32)
       (get_global $null_char)
       (set_local $return_value)
       (get_local $n)
       (i32.const 0)
       (i32.gt_s)
       (if
           (then
            (get_local $list_addr)
            (get_local $n)
            (call $find_nth_element)
            (set_local $pointer)
            (get_local $pointer)
            (call $cdr)
            (set_local $next_addr)

            (get_local $list_addr)
            (get_local $n)
            (i32.const 1)
            (i32.sub)
            (call $find_nth_element)
            (call $cdr_addr)
            (get_local $next_addr)
            (i32.store)))
       (get_local $pointer)
       (call $get_type)
       (get_global $type_object)
       (i32.eq)
       (if
           (then
            (get_local $pointer)
            (call $car)
            (set_local $return_value)))
       (get_local $pointer)
       (call $free_list_el)
       (drop)
       (get_local $return_value))

 (func $garbage_collect (param $tab_addr i32)
       (local $pointer1 i32)
       (local $pointer2 i32)
       (local $counter i32)
       (set_local $counter (i32.const 1))
       (block $iter
         (loop
          (get_local $tab_addr)
          (get_local $counter)
          (call $find_nth_element)
          (set_local $pointer1)
          (get_local $pointer1)
          (call $car)
          (set_local $pointer2)

          (get_local $pointer2)
          (i32.const 2)
          (call $find_nth_element)
          (call $car)
          (i32.const 0)
          (i32.eq)
          (if
              (then
               (get_local $tab_addr)
               (get_local $pointer2)
               (i32.const 1)
               (call $find_nth_element)
               (call $car)
               (call $free_gc_list)))

          (get_local $pointer1)
          (call $cdr)
          (get_global $list_end_char)
          (i32.eq)
          (br_if $iter)

          (get_local $counter)
          (i32.const 1)
          (i32.add)
          (set_local $counter)

          (br 0))))

 (export "check_free_space" (func $check_free_space))
 (export "find_free" (func $find_free))
 (export "create_list_el" (func $create_list_el))
 (export "garbage_collect" (func $garbage_collect))
 (export "free" (func $free))
 (export "remove_nth_list_el" (func $remove_nth_list_el))
 (export "free_list_el" (func $free_list_el))
 (export "get_type" (func $get_type))
 (export "car" (func $car))
 (export "cdr" (func $cdr))
 (export "car_addr" (func $car_addr))
 (export "cdr_addr" (func $cdr_addr))
 (export "find_value_in_alist_from_key" (func $find_value_in_alist_from_key))
 (export "decrease_rc" (func $decrease_rc))
 (export "increase_rc" (func $increase_rc))
 (export "free_gc_list" (func $free_gc_list))
 (export "create_gc_list" (func $create_gc_list))
 (export "malloc" (func $malloc))
 (export "add_to_rc_tab" (func $add_to_rc_tab))
 (export "concat" (func $concat))
 (export "find_nth_element" (func $find_nth_element))
 (export "create_list" (func $create_list))
 (export "is_list_empty" (func $is_list_empty))
 (export "find_last_element" (func $find_last_element))
 (export "add_element" (func $add_element)))
