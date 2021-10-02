const fs = require('fs'),
    path = require('path'),
    satellite = require('satellite.js')

const orbitals = fs.readFileSync(path.join(__dirname, 'catalog.txt'), { encoding: 'utf8', flag: 'r' });

console.log(orbitals);

let arr = [];
let orbitalsArr = orbitals.split('\n'),
    length = orbitalsArr.length;

for (let i = 0; i < x - 1; i += 3) {

    console.log(i);
    arr.push({
        id: orbitalsArr[i],

    })
}

console.log(arr[5].i);