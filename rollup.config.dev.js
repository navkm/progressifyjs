import strip from 'rollup-plugin-strip';
import resolve from 'rollup-plugin-node-resolve';
export default [
    {
        input: 'src/pwa.js',
        output: {
            file: 'dist/progressify-pwa.js',
            format: 'iife',
            name: 'progressify'
        },
        plugins: [
            resolve(),
            strip({
                debugger: true,
                functions: [],
                sourceMap: false
            })
        ]
    },
    {
        input: 'src/sw.js',
        output: {
            file: 'dist/progressify-sw.js',
            format: 'iife',
            name: 'progressify'
        },
        plugins: [
            resolve(),
            strip({
                debugger: true,
                functions: [],
                sourceMap: false
            })
            
        ]
    }
]
