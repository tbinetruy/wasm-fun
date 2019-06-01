(module
 (import "console" "log" (func $log (param i32 i32)))
 (import "js" "mem" (memory 1))
 (data (i32.const 0) "Hi")
 (func (export "writeHi")
       i32.const 0
       i32.const 2
       call $log)
 (func $square (param $number i32) (result i32)
       get_local $number
       get_local
       i32.mul)
 (func $add (param $lhs i32) (param $rhs i32) (result i32)
       (get_local $lhs)
       (get_local $rhs)
       (i32.add))
 (func $reward (param $input i32) (result i32)
       get_local $input
       i32.const 2
       call $add
       call $square)
 (export "add" (func $add))
 (export "reward" (func $reward))
 (export "square" (func $square)))

