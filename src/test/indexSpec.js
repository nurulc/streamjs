/*
Copyright (c) 2016, Nurul Choudhury

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

*/

import { Stream , LazyStream               } from "../index";	
import { expect} from "chai";
import regeneratorRuntime from "regenerator-runtime/runtime";

const isEven = x => x % 2 === 0 ;
const less = (a,b) => a < b ;
const NOT =  f => x => !f(x);
const sum = (a,b) => a+b;
describe("Stream testing", () => { 

    describe("simple stream tests", () =>{
// Example of use from the test cases
//
		it("create a stream 1 element", () =>{
 			var s = Stream.make(1);
 			expect(s.head()).to.equal(1);
 			expect(s.length()).to.equal(1);
 			expect(s.empty()).to.equal(false);
 			expect(s.tail().empty()).to.equal(true);
 		});
 	    
		it("create a stream 10 element", () =>{
 			var s = Stream.make(1,2,3,4,5,6,7,8,9,0);
 			expect(s.head()).to.equal(1);
 			expect(s.tail().head()).to.equal(2);
 			expect(s.length()).to.equal(10);
 			expect(s.toString()).to.equal('[1, 2, 3, 4, 5, 6, 7, 8, 9, 0]');
 		});
    	it("- 10 element test drop and filter", () =>{
 			var s1 = Stream.make(-1,-1,-1,1,2,3,4,5,6,7,8,9,0);
 			var s = s1.drop(3);
 			expect(s1.toString()).to.equal('[-1, -1, -1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0]');
 			expect(s.toString()).to.equal('[1, 2, 3, 4, 5, 6, 7, 8, 9, 0]');
 			expect(s.drop(8).toString()).to.equal('[9, 0]');
 			expect(s.drop(10).empty()).to.equal(true);
 
 			expect(s.filter(NOT(isEven)).toString()).to.equal('[1, 3, 5, 7, 9]');-1, 
 			expect(s.drop(NOT(isEven)).toString()).to.equal('[2, 3, 4, 5, 6, 7, 8, 9, 0]');
 			expect(s.filter(NOT(isEven)).drop(NOT(isEven)).toString()).to.equal('[]');
 			expect(s.filter(NOT(isEven)).drop(NOT(isEven)).empty()).to.equal(true);
 		});
    	it("- 10 element, using range test drop and filter and take", () =>{
 			var s = Stream.range(1,100).take(10);
 			expect(s.drop(8).toString()).to.equal('[9, 10]');
 			expect(s.drop(10).empty()).to.equal(true);
 
 			expect(s.filter(NOT(isEven)).toString()).to.equal('[1, 3, 5, 7, 9]');
 			expect(s.drop(NOT(isEven)).toString()).to.equal('[2, 3, 4, 5, 6, 7, 8, 9, 10]');
 			expect(s.filter(NOT(isEven)).drop(NOT(isEven)).toString()).to.equal('[]');
 			expect(s.filter(NOT(isEven)).drop(NOT(isEven)).empty()).to.equal(true);
 		});

    	it("- infinite list, using range test drop and filter and take", () =>{
 			var oddSet = Stream.range(1,undefined,2);
 			var evenSet = Stream.range(2,undefined,2);
 			var nums = oddSet.merge(evenSet);
 			expect(nums.drop(8).take(2).toString()).to.equal('[9, 10]');
 			expect(nums.take(10).drop(10).empty()).to.equal(true);
 
 			expect(nums.take(10).filter(NOT(isEven)).toString()).to.equal('[1, 3, 5, 7, 9]');
 			expect(nums.take(10).drop(NOT(isEven)).toString()).to.equal('[2, 3, 4, 5, 6, 7, 8, 9, 10]');
 			expect(nums.take(10).filter(NOT(isEven)).drop(NOT(isEven)).toString()).to.equal('[]');
 			expect(nums.take(10).filter(NOT(isEven)).drop(NOT(isEven)).empty()).to.equal(true);
 			expect(nums.take(100).filter(NOT(isEven)).drop(NOT(isEven)).empty()).to.equal(true);
 			
 		});
    	it("- infinite list, using range test drop and filter and take", () =>{
 			var odd = Stream.range(1,undefined,2);
 			var even = Stream.range(2,undefined,2);
 			var nums = odd.merge(even);
 			expect( nums.take(100).reduce(sum) ).to.equal(5050);
 			expect( nums.take(1000000).reduce(sum) ).to.equal(500000500000); // test with a big lazy list
 			
 		});
    });


    describe("Lazy Stream", () =>{
// Example of use from the test cases
//
		it("create a stream 1 element", () =>{
 			var s = LazyStream.make(1);
 			expect(s.head()).to.equal(1);
 			expect(s.length()).to.equal(1);
 			expect(s.empty()).to.equal(false);
 			expect(s.tail().empty()).to.equal(true);
 		});
 	    
		it("create a stream 10 element", () =>{
 			var s = LazyStream.make(1,2,3,4,5,6,7,8,9,0);
 			expect(s.head()).to.equal(1);
 			expect(s.tail().head()).to.equal(2);
 			expect(s.length()).to.equal(10);
 			expect(s.toString()).to.equal('[1, 2, 3, 4, 5, 6, 7, 8, 9, 0]');
 		});
    	it("10 element test drop and filter", () =>{
 			var s1 = LazyStream.make(-1,-1,-1,1,2,3,4,5,6,7,8,9,0);
 			var s = s1.drop(3);
 			expect(s1.toString()).to.equal('[-1, -1, -1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0]');
 			expect(s.toString()).to.equal('[1, 2, 3, 4, 5, 6, 7, 8, 9, 0]');
 			expect(s.toString()).to.equal('[1, 2, 3, 4, 5, 6, 7, 8, 9, 0]');
 			expect(s.drop(8).toString()).to.equal('[9, 0]');
 			expect(s.drop(10).empty()).to.equal(true);
 
 			expect(s.tail().cons(3,Stream.EMPTY).toString()).to.equal('[3]');
 			
 			expect(s.filter(NOT(isEven)).tail().tail().head()).to.equal(5); 
 			expect(s.filter(NOT(isEven)).toString()).to.equal('[1, 3, 5, 7, 9]'); 
 			expect(s.drop(NOT(isEven)).toString()).to.equal('[2, 3, 4, 5, 6, 7, 8, 9, 0]');
 			expect(s.filter(NOT(isEven)).drop(NOT(isEven)).toString()).to.equal('[]');
 			expect(s.copy().filter(NOT(isEven)).drop(NOT(isEven)).empty()).to.equal(true);
 		});
 		
    	it("10 element, using range test drop and filter and take", () =>{
 			var s = LazyStream.range(1,100).take(10);
 			expect(s.drop(8).toString()).to.equal('[9, 10]');
 			expect(s.drop(10).empty()).to.equal(true);
 
 			expect(s.filter(NOT(isEven)).toString()).to.equal('[1, 3, 5, 7, 9]');
 			expect(s.drop(NOT(isEven)).toString()).to.equal('[2, 3, 4, 5, 6, 7, 8, 9, 10]');
 			expect(s.filter(NOT(isEven)).drop(NOT(isEven)).toString()).to.equal('[]');
 			expect(s.filter(NOT(isEven)).drop(NOT(isEven)).empty()).to.equal(true);
 		});

    	it("infinite list, using range test drop and filter and take", () =>{
 			var oddSet = LazyStream.range(1,undefined,2);
 			var evenSet = LazyStream.range(2,undefined,2);
 			var nums = oddSet.merge(less, evenSet);
 			expect(nums.drop(8).take(2).toString()).to.equal('[9, 10]');
 			expect(nums.take(10).drop(10).empty()).to.equal(true);
 
 			expect(nums.take(10).filter(NOT(isEven)).toString()).to.equal('[1, 3, 5, 7, 9]');
 			expect(nums.take(10).drop(NOT(isEven)).toString()).to.equal('[2, 3, 4, 5, 6, 7, 8, 9, 10]');
 			expect(nums.take(10).filter(NOT(isEven)).drop(NOT(isEven)).toString()).to.equal('[]');
 			expect(nums.take(10).filter(NOT(isEven)).drop(NOT(isEven)).empty()).to.equal(true);
 			expect(nums.take(100).filter(NOT(isEven)).drop(NOT(isEven)).empty()).to.equal(true);
 			
 		});
    	it("infinite list, using range test drop and filter and take", () =>{
 			var odd = LazyStream.range(1,undefined,2);
 			var even = LazyStream.range(2,undefined,2);
 			var nums = odd.merge(less, even);
 			expect( nums.take(100).reduce(sum) ).to.equal(5050);
 			expect( nums.take(100000000).reduce(sum) ).to.equal(5000000050000000); // test with a big lazy list
 			
 		});
		
    });

	    
 	describe("generator", () => {
 	
 		it("test generator",() =>{
 		  function* num() {
 		  	let i=1;
 		  	while(true) {
 		  		yield i++;
 		  	}
 		  }
 		  var total = 0;
 		  let p = num();
 		  for(let i=0; i<100000000; i++) total += p.next().value; 
 		  expect( total ).to.equal(5000000050000000);
 		});

 		it("simple javascript",() =>{
          
          var total1 = 0|0;
          
          for(let i=1|0; i<=100000000; i++) total1 += i; 
          expect( total1 ).to.equal(5000000050000000);
        });			 			

 		it("regexp or abc|abd", () =>{
 			 			
 		});
 	});
  
});


/*
       Stream.range = function(low, high, inc) 
        Stream.gen = function(f, oldV,ix, prevHead) 
        Stream.reverse = function(stream) 
        Stream.make = function( list of args )  
        Stream.arr = function(array, from) 
        Stream.asStream = function(arrayOrVal) 
        Stream.takeNBefore = function(stream,item,n)
*/