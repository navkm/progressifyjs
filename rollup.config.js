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
            strip({
                // set this to `false` if you don't want to
                // remove debugger statements
                debugger: true,

                // defaults to `[ 'console.*', 'assert.*' ]`
                functions: ['console1.log', 'assert.*', 'debug', 'alert'],

                // set this to `false` if you're not using sourcemaps –
                // defaults to `true`
                sourceMap: false
            }),
            resolve()

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
            strip({
                // set this to `false` if you don't want to
                // remove debugger statements
                debugger: true,

                // defaults to `[ 'console.*', 'assert.*' ]`
                functions: ['console1.log', 'assert.*', 'debug', 'alert'],

                // set this to `false` if you're not using sourcemaps –
                // defaults to `true`
                sourceMap: false
            }),
            resolve()
        ]
    }


]