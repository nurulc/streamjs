/*

*/

// Implementation of lazy stream, it laso looks like a lazy list
// See documentation
// The code heavily borrows form other ideas and implementations seen on the internet
// the interface to streams is pretty similar to Array, except for the indexing capability

exports = exports || {};

function Stream(head, tailPromise) {   
    this.headValue = head;
    if (typeof tailPromise == 'undefined') {
        tailPromise = function() {
            return new Stream();
        };
    }
    this.tailPromise = tailPromise; // function to compute the tail only when we do not have a tailValue (memoize the tail)
    this.tailValue = undefined;     // if we already have a tail vale we dont use the promise to get the tail value
                                    // essentially er memoise the result of the tail promise
}

function LazyStream(head, tailPromise) {   
    this.headValue = head;
    if (typeof tailPromise == 'undefined') {
        tailPromise = function() {
            return new Stream();
        };
    }
    this.tailPromise = tailPromise; // function to compute the tail only when we do not have a tailValue (memoize the tail)
    this.tailValue = undefined;     // if we already have a tail vale we dont use the promise to get the tail value
                                    // essentially er memoise the result of the tail promise
}

exports.LazyStream = LazyStream;
exports.Stream = Stream;

(
    function() {
// contracts code borrowed from Mike Stay -http://jscategory.wordpress.com/
// Really great utilities for type (contract) validation

        var call = Function.prototype.call;
        var slice = call.bind([].slice);
        var getClassName = call.bind({}.toString);

        // A contract that allows anything

        var isUndef = function(x) { return (typeof x == 'undefined'); };
        var NVL= function(v,dflt) { return isUndef(v)? dflt: v; }
        var any = function(x) {
            return x;
        };
        var isClassOf = function(s) {
            var TYPE = "[object " + s + "]";
            return function(v) {
                return (getClassName(v) == TYPE)? v : undefined;
            };
        };


        var classOf = function(s) {
            var TYPE = "[object " + s + "]";
            return function(v) {
                if (getClassName(v) !== TYPE) {
                    throw new TypeError("Expected " + s);
                }
                return v;
            };
        };

        var isArr = isClassOf("Array");


        // Manditory contract
        var arr = classOf("Array");

        var isTypeOf = function(s) {
            return function(v) {
                return (typeof v == s)?v:undefined;
            };
        };

        // Creates a contract for a value of type s
        var typeOf = function(s) {
            return function(v) {
                if (typeof v !== s) {
                    throw new TypeError("Expected a" + (s === "object" ? "n" : "") + s + ".");
                }
                return v;
            };
        };

        var isStr = isTypeOf("string");
        //Manditory contract
        var func = typeOf("function");
        var isFunc = isTypeOf("function");

        // Creates a contract for an object inheriting from ctor
        var instanceOf = function(ctor) {
            return function(inst,msg) {
                if (!(inst instanceof ctor)) {
                    msg = msg || 'No message';
                    throw new TypeError(msg + " Expected an instance of " + ctor.name + " but found: " + inst);
                }
                return inst;
            };
        };

        var strm = instanceOf(Stream);
        var isStream = function(s) {
            return (s instanceof Stream);
        };



        // Asserts int32 and nonnegative
        var nat32 = function(n) {
            if ((n | 0) !== n || n < 0) {
                throw new TypeError("Expected a 32-bit natural.");
            }
            return n;
        };



// ======== end contracts code (Mike's code) =======

        var NOT = function(fn) {
            if(isFunc(fn)) return function(v) { return !fn(v); }
            return fn;
        }
        
        var makeConsX = function(aStream) {
            return function(h, tail, aStreamNode) {
                //aStream.nodesCreated += 1;
                // if we have a target do not create a new element
                // just fill the traget instead
                if( aStreamNode === undefined ) aStreamNode = new (aStream)(h);
                else {
                    strm(aStreamNode);
                }

                if (isStream(tail)) {  
                    return aStreamNode._assign(h,undefined, tail);        // if t is already a stream and not a function, save the value
                }
                else return aStreamNode._assign(h,tail);
            };
        };

       var makeCons = function(aStream) {
            return function(h, tail) {
                if (isStream(tail)) {  
                    var strm = new (aStream)(h);        // if t is already a stream and not a function, save the value
                    strm.tailValue = tail;
                    return strm;
                }
                return new (aStream)(h,tail);
            };
        };


        var cons = makeCons(Stream);
        // expect an arry of anything, or anything and returns a string
        function toStr(x) {
          return isArr(x) ? "[" + x.toString() + "]" : x.toString();
        }
        function notEmpty(strm,msg) {
           if(!isStream(strm)) throw new TypeError("Non-empty stream expected"+ msg?" - "+msg:"");
           return strm.notEmpty(msg);
        }

        Stream.nodesCreated = 0;            // useful for benchmarking and understanding algorithn behavior

        Stream.prototype = {
            _assign(head, tailFunc, tailValue) {
                this.headValue = head;
                this.tailPromise = tailFunc;
                this.tailValue = tailValue;
                return this;
            },
            copy: function() { return this; },  // a Stream node is immutable, so it is safe to just return it
            empty: function() {
                return this === EMPTY || isUndef(this.headValue);
            },
            notEmpty: function(msg) {
                if( this.empty() ) notEmpty(undefined, msg);
                return this;
            },
            head: function() {
                return notEmpty(this).headValue;
            },
            tail: function() {
                if (isUndef(notEmpty(this).tailValue)) { // we dont have the tail value
                    func(this.tailPromise);                     // amke sure it is a function
                    this.tailValue = this.tailPromise(); // use the function to compute it, and make sure it is a Stream
                                                         // this makes sure you have to compute it only once
                    this.tailPromise = undefined;       // Used it (the tail function) no longer need it, since the result is in
                }
                return this.tailValue; // means the tail have been evaluated (and cached) then just return it.
            },
            lazyTail: function() {
                if(this === EMPTY) return EMPTY;
                if( this.tailValue ) return this.tailValue;
                return strm(this.tailPromise()); // use the function to compute it, and make sure it is a Stream
            },
            tailPromiseOrValue: function() {
                if( this.isEmpty() ) return EMPTY;
                if( this.tailPromise !== undefined ) return this.tailPromise();
                return this.tailValue;
            },
            item: function(n) { // get the n item from the current position in the stream
                var s = notEmpty(this).drop(nat32(n)-1);
                return notEmpty(s,"item does not exist").head();
            },
            length: function() {  // get the length of the stream - could go on for ever (until we run out of memory)
                var s = this;
                var len = 0;
                while (!s.empty()) {
                    ++len;
                    s = s.lazyTail();
                }
                return len;
            },
            append: function(stream) {
                strm(stream,'append');
                if (this.empty()) return stream;
                var self = this;
                return this.cons(this.head(), function() {
                    return self.tail().append(stream);
                });
            },
            flatten: function() {
                if (this.empty()) return this;
                if (isStream(this.head())) { return this.head().append(strm(this.tail()).flatten()); }
                var self = this;
                return this.cons(this.head(), function() {
                            return self.tail().flatten();
                            } );
            },
            flatMap: function(f) {
                return this.map(func(f)).flatten();
            },
            add: function(strm) {
                strm(s);
                return this.zip(function(x, y) {
                    return x + y;
                }, strm);
            },
            zip: function(f, strm) {
                if (this.empty()) {
                    return strm;
                }
                if (strm.empty()) {
                    return this;
                }
                func(f);
                var self = this;
                return this.cons(f(this.head(), strm.head()), function() {
                    return self.tail().zip(f, strm.tail());
                });
            },
            merge: function(f, astrm) {
                if(arguments.length === 1 ) return this.simpleMerge(f);
                return this.dataMerge(f,astrm);
            },
            dataMerge: function(f, astrm) {
                if (this.empty()) {
                    return astrm;
                }
                if (astrm.empty()) {
                    return this;
                }
                func(f);
                var self = this;
                func(self.cons);
                if(f(this.head(), astrm.head())) return this.cons(this.head(), function() { return self.tail().dataMerge(f, astrm);});
                else return                             this.cons(astrm.head(), function() { return self.dataMerge(f, astrm.tail());  });
            },
            simpleMerge: function(astrm) {
                if (this.empty()) {
                    return astrm;
                }
                if (astrm.empty()) {
                    return this;
                }
                func(f);
                var self = this;
                return this.cons(this.head(), function() { return astrm.simpleMerge(self.tail());});
            },
            map: function(f,thisArg,ix) {
                func(f);
                if (this.empty()) {
                    return this;
                }
                var self = this;
                ix = ix || 0;
                return this.cons(f.call(thisArg,this.head(),ix, this), function() {
                    return self.tail().map(f,thisArg,ix+1);
                });
            },
            forEach: function(f,thisArg,ix) { // eagear version of each
                func(f);
                var i = this;
                ix = ix || 0;
                while (!i.empty()) {
                    f.call(thisArg,i.head(),ix++,this);
                    i = i.lazyTail();
                }
                return this;
            },
            // Prefer to define this recursively, but it will blow the stack
            reduce: function(aggregator, initial,ix) {
                func(aggregator);
                if (this.empty()) {
                    return initial;
                }
                ix = ix || 0;
                var res = initial===undefined? this.head() : aggregator(initial, this.head(),ix,this);
                let s = this.lazyTail();
                while( !s.empty()) {;
                    res = aggregator(res, s.head(),++ix,s);
                    s = s.lazyTail();
                }
                return res;
            },
            reduceL: function(aggregator, initial,ix) {  // make a stream from each reduce step (we cna now reduce an infinite list)
                func(aggregator);
                if (this.empty()) {
                    return Stream.make(initial);
                }
                ix = ix || 0;
                var v = aggregator(initial, this.head(),ix,this);
                var self = this;
                return this.cons(v, function() {
                                return self.tail().reduceL(aggregator, v, ix+1);
                            });
            },
            sum: function() {
                return this.reduce(function(a, b) {
                    return a + b;
                }, 0);
            },
            force: function(f /* optional */ ) {
                var stream = this;
                f =  func(f || any) ; // check if we have (optional) function or use noop func where any(x) = x
                while (!stream.empty()) {
                    f(stream.head());
                    stream = stream.tail();
                }
                return this;
            },

            filter: function(f,thisArg,ix) {
                func(f);
                ix = ix || 0;

                var selfIx = this.dropx(f,thisArg,ix); // drop elements that f(head, this) is false
                var self = selfIx[0];
                var ix1 = selfIx[1];
                if (self.empty()) {  return EMPTY;   }
                return this.cons(self.head(), function() { return self.tail().filter(f,thisArg,ix1); });
            },
            take: function(howmany) {
                if (this.empty()) { return this;  }
                if (nat32(howmany) === 0) { return EMPTY; }

                var self = this;
                return ((howmany - 1) === 0 ? self.cons(self.head(), EMPTY) :
                    self.cons(self.head(), function() {
                        return self.tail().take(howmany - 1);
                    }));
            },

            dropx: function(funcOrNumber,thisArg,ix) { // if function drop elements while the f(head) === false, the function is really a drop until
                var fn = isFunc(funcOrNumber) ||
                         (function(n) { return function(v) { return n-- <= 0; };
                         })(nat32(funcOrNumber));

                var self = this;
                ix = ix || 0;
                while (!self.empty()) {
                    if( fn.call(thisArg, self.head(), ix) ) {
                        //console.log(self.copy().toString());
                        return [self,ix];
                    }    
                    self = self.tail();
                    ix++;
                }
                return [self,ix];
            },
            drop: function(funcOrNumber,thisArg,ix) { return this.dropx(NOT(funcOrNumber),thisArg,ix)[0]; },
            find: function(funcOrNumber,thisArg,ix) { return this.dropx(func(funcOrNumber),thisArg,ix)[0]; },
            /*
               usage:
                  stringStream.at('123')  // assume this is a stream of strings, return EMPTY, of the stream that has '123' as the head element
                  numStream.at(isEven) // return  stream where the head element isEven (function isEven(a) { return a % 2 === 0; })

            */
            at: function(funcOrValue, thisArg,ix) {  // find the position in the stream where the first occurance of 'funcOrValue' is found if funcOrValue is a value, of when funcOrValue(head) is true
                ix = ix || 0;
                return this.drop(isFunc(funcOrValue) || function(v) { return v === funcOrValue; }, thisArg, ix)
            },
            print: function(n) {
                var l = !isUndef(n) ? this.take(nat32(n)) : this; // take first n elements or entire list
                this.console.log(l.toString());
                return this;
            },
            toString: function() {
                if (this.empty()) return "[]";
                return '[' + this.join(", ") + ']';
            },
            join: function(sep) {
                return this.reduce(function(list, x) {
                    list.push(toStr(x));
                    return list;
                }, []).join(sep);
            },
            reverse: function () {
                if(this.empty() || this.tail().empty()) {
                          return this; // nothing to do if 1 element or empty list
                }
                var res = EMPTY;
                var self = this;
                while (!self.empty()) {
                    res = cons(self.head(), res);  // make this a hard cons - so it will always return a non lazy stream
                    self = self.tail();
                }
                return res;
            },
            cons: makeCons(Stream)
        };

        Stream.range = function(low, high, inc) {
            low = NVL(low,1);
            inc = NVL(inc,1);
            var self = this;
            if (low === high) { return self.cons(low,EMPTY);  }
            return self.cons(low, function() {
                return self.range(low + inc, high, inc);
            });
        };

        // This method is tricky, since the generator function (f) need a reference to the stream is is creating
        // so we have to resort to a messy forward rference when evaluating the generator function

        Stream.gen = function(f, oldV,ix, prevHead) {  // A Stream generated from an iteration function (Stream generator)
                ix = ix || 0;
                func(f);
                var newV , curr;
                var self = this;
                curr = this.cons(undefined, function() { return self.gen(f, newV, ix+1,curr); });
                curr.headValue = f(oldV,ix, curr, prevHead);
                return curr;
        };

        Stream.reverse = function(stream) {
            return isUndef(stream)? stream : stream.reverse();
        };

        Stream.make = function(/* list of args */) { // convert a list of args to a stream
            var l = arguments.length;
            var s =  EMPTY;
            for( ; l>0; l--) { s =  this.cons(arguments[l-1], s); }
            return s;
        };
        Stream.arr = function(array, from) { // Convert an array to stream
            arr(array);       // make sure array is an Array using arr() contract
            from = from || 0 ;
            if( from >= array.length) { return EMPTY; }
            var self = this;
            return self.cons(array[from], function() { return self.arr(array,from+1); } );
        };
        Stream.asStream = function(arrayOrVal) { // recursive version of Stream.arr, takes care of arroy of array ...
            if (isUndef(arrayOrVal) ) return EMPTY;
            var self = this;
            if (isArr(arrayOrVal)) {
                if (arrayOrVal.length === 0) return EMPTY;
                var array = slice(arrayOrVal, 1);
                var h = arrayOrVal[0];
                return self.cons(isArr(h) ? self.asStream(h) : h, function() {
                    return self.asStream(array);
                });
            }
            return this.make(arrayOrVal);
        };

        Stream.takeNBefore = function(stream,item,n) {  // from list find item, take n elements before an item
            var start = stream;
            if( start.empty() ) return start;
            var current = start;
            var bestBase = current;    // bestBase, we attempt set it 'n' elements before 'current' (current pos)
                                       // once we get there we keep moving bestBase and current together

            var gap = 0;               // our target is to reach gap == n,
                                       //gap the the distance from 'bestBase'
            while(!current.empty()) {
                if(current.head() === item) return this.cons(bestBase.take(gap), current.tailPromiseOrValue()); // found the item, i is always <= n
                current = current.tail();              // Note: bestBase, keep 'n' nodes prior to current,
                if( gap < n) { gap++;                } // so dont move bestBase, we haven't reached the 'gap' of 'n';
                else         { bestBase = bestBase.tail(); } // correct gap, so we have to move bestBase
            }
            return this.cons(bestBase.take(gap), EMPTY);
        };
/* Much nicer version - but tail recursion kills us (easy to blow out the stack)
        Stream.takeNBeforeRecursive = function(start,item,n) {  // take n elements before an item
            var nBefore = function(start,current,gap) {
                if( current.empty() || current.head() == item ) return start.take(gap);
                if( gap < n) return nBefore(start, current.tail(), gap+1);  //
                return nBefore(start.tail(), current.tail(), n);           // gap is correct so move them both
            }
            return nBefore(start,start,0);
        };
*/
        Stream.cons = makeCons(Stream);
        var EMPTY = new Stream(undefined, undefined);

        Stream.EMPTY = EMPTY;

// Lazy version
        var lazyCons = makeCons(LazyStream);
        var lazyConsX = makeConsX(LazyStream);

        /*
            this cons is to make sure we do not destroy the current code,
            so we cycle between spare and this for constructing new elements
            the whole idea of lazy stream is that we are not creating and destroying nodes,
            so we are cycling between this and spare;
            this.cons(...) with fill and return spare
            this.spare.cons(...) will fill and return 'this'
        */
        function lcons(a,b) {
            var spare = this.spare; 
            strm(this);
            if( spare === undefined) {
                spare = new LazyStream();
                this.spare = spare;
                spare.spare = this;
            }    
            //if(! isStream(this.spare)) throw Error("lcons spare expected a stream");
            strm(this.spare);
            return lazyCons(a,b,this.spare);
        };

        function copyLazyStream() {
            var aCopy = new LazyStream();
            aCopy._assign(this.headValue, this.tailPromise, this.tailValue);
            //aCopy.cons = lazyCons;  // this prevents aCopy node ever being reused
            Object.setPrototypeOf(aCopy,StartLazyStream);
            return aCopy;
        }

        LazyStream.prototype = Object.create(Stream.prototype, {
            tail: { value: func(Stream.prototype.lazyTail)},
            //cons: { value: func(lcons)},
            cons: { value: func(lazyCons)},
            //copy: { value: func(copyLazyStream) },
        });
        
        //LazyStream.cons = lazyCons;
        var StartLazyStream = Object.create(LazyStream.prototype, {
            cons: { value: func(lazyCons)},
        }); 

/*        
        //StartLazyStream.prototype.constructor = LazyStream;
        //LazyStream.cons = lazyCons;

        // Note: LazyStream node is not immpuable, it get reused a log
        // But we want the first node in the stream to be immutable
        // So the lazy stream creator methods have to make the first node in the stream immutable
        // we do that by replacing the cons method of the first node make that node immotable
        //
        // This is an issue with leaky abstraction, I have not figured out how to a partially constructed
        // stream truely appear to be immutable, so I added a copy method

        for(var k in Stream) {
            var f = Stream[k]; 
            (function(f, k){
                if( isFunc(f) ) {
                    LazyStream[k] = function() {
                       var result = f.apply(this, slice(arguments));
                       Object.setPrototypeOf(result,StartLazyStream);                     // cons is non destructive, so prevent the destruction of the top leven element
                       return result;
                    } 
               }
               else LazyStream[k] = f;
             } )(Stream[k],k);
        }
*/
        for(var k in Stream) LazyStream[k] = Stream[k];         
        LazyStream.cons = lazyCons;
        LazyStream.prototype.constructor = LazyStream;

    })();


