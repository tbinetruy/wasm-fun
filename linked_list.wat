(module
 (import "js" "mem" (memory 1))

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
          (i32.const 0)
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
          (i32.const 0)
          (i32.ne)
          (i32.or)
          (br_if $iter)

          (i32.const 4)
          (get_local $i)
          (i32.add)
          (set_local $i)

          (br 0)))
       get_local $return)

 (func $find_free (param $i i32) (result i32)
       (get_local $i)
       (i32.const 4)
       (i32.mul)
       (set_local $i)
       (block $iter
         (loop
           (get_local $i)
           (i32.load)
           (i32.const 0)
           (i32.eq)
           (br_if $iter)

           (i32.const 4)
           (get_local $i)
           (i32.add)
           (set_local $i)
           (br 0)))
       (get_local $i))

 (func $malloc (param $l i32) (result i32)
       (local $i i32)
       (local $j i32)

       (set_local $i (i32.const 0))
       (set_local $j (i32.const 0))

       (get_local $i)
       (call $find_free)
       (set_local $i)
       (get_local $i))

 (func $create_list (result i32)
       i32.const 1
       i32.const 1
       i32.add)

 (func $add_element (param $el i32) (param $list i32) (result i32)
       get_local $el)

 (export "check_free_space" (func $check_free_space))
 (export "find_free" (func $find_free))
 (export "malloc" (func $malloc))
 (export "create_list" (func $create_list))
 (export "add_element" (func $add_element))
)
