const load_wasm = async () => {
    const response = await fetch("index.wasm");
    const buffer = await response.arrayBuffer();
    const obj = await WebAssembly.instantiate(buffer);
    console.log(obj.instance.exports.add(1, 2));  // "3"
};

load_wasm();
