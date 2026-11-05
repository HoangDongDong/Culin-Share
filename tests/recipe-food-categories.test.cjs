const test = require('node:test');
const assert = require('node:assert/strict');
const {classify} = require('../backend/database/imports/recipe-categories-v1');

test('food categories describe the dish rather than the dataset or unreliable source label', () => {
    const cases = {
        'Bánh canh cua':'mon-nuoc', 'Bún ốc':'mon-nuoc', 'Vịt nấu thơm':'mon-man',
        'Sữa chua nếp cẩm dẻo bùi':'mon-trang-mieng', 'Bánh Sữa Chua Xoài':'mon-trang-mieng',
        'Trà sữa hoa đậu biếc':'do-uong', 'Sữa đậu nành':'do-uong', 'Sữa chua uống':'do-uong',
        'Bánh crepe kem chuối':'mon-trang-mieng', 'Bánh cupcake mặn':'cac-loai-banh',
        'Bánh rán kẹp pate thịt xông khói':'cac-loai-banh', 'Bánh mì':'mon-an-sang',
        'Canh chua cá lóc':'mon-nuoc', 'Tôm hấp sả':'hai-san', 'Cá lóc kho tiêu':'mon-man',
        'Bún cá xào':'mon-man', 'Gỏi ngó sen tôm thịt':'goi-salad', 'Nước mắm gừng':'gia-vi-nuoc-sot',
        'Đậu hũ nhồi thịt':'mon-man', 'Lẩu chay':'mon-chay', 'BÁNH CANH CUA':'mon-nuoc',
    };
    for (const [title, slug] of Object.entries(cases)) assert.equal(classify({title,rawDishType:'Món mặn'}).slug,slug,title);
    assert.equal(classify({title:'Đậu hũ xào nấm',rawDishType:'Món chay',ingredients:[{name:'Nấm'}]}).slug,'mon-chay');
    assert.equal(classify({title:'Cà tím nướng',rawDishType:'Món chay',ingredients:[{name:'Cà tím'}]}).slug,'mon-chay');
    assert.equal(classify({title:'Đậu hũ nhồi',rawDishType:'Món chay',ingredients:[{name:'Thịt heo'}]}).slug,'mon-man');
});
