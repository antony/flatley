/* globals suite test */

var assert = require('assert')
var flatley = require('../index')
var flatten = flatley.flatten
var unflatten = flatley.unflatten

var primitives = {
  String: 'good morning',
  Number: 1234.99,
  Boolean: true,
  Date: new Date(),
  null: null,
  undefined: undefined
}

suite('Flatten Primitives', function () {
  Object.keys(primitives).forEach(function (key) {
    var value = primitives[key]

    test(key, function () {
      assert.deepEqual(flatten({
        hello: {
          world: value
        }
      }), {
        'hello.world': value
      })
    })
  })
})

suite('Unflatten Primitives', function () {
  Object.keys(primitives).forEach(function (key) {
    var value = primitives[key]

    test(key, function () {
      assert.deepEqual(unflatten({
        'hello.world': value
      }), {
        hello: {
          world: value
        }
      })
    })
  })
})

suite('Flatten', function () {
  test('Nested once', function () {
    assert.deepEqual(flatten({
      hello: {
        world: 'good morning'
      }
    }), {
      'hello.world': 'good morning'
    })
  })

  test('Nested twice', function () {
    assert.deepEqual(flatten({
      hello: {
        world: {
          again: 'good morning'
        }
      }
    }), {
      'hello.world.again': 'good morning'
    })
  })

  test('Multiple Keys', function () {
    assert.deepEqual(flatten({
      hello: {
        lorem: {
          ipsum: 'again',
          dolor: 'sit'
        }
      },
      world: {
        lorem: {
          ipsum: 'again',
          dolor: 'sit'
        }
      }
    }), {
      'hello.lorem.ipsum': 'again',
      'hello.lorem.dolor': 'sit',
      'world.lorem.ipsum': 'again',
      'world.lorem.dolor': 'sit'
    })
  })

  test('Custom Delimiter', function () {
    assert.deepEqual(flatten({
      hello: {
        world: {
          again: 'good morning'
        }
      }
    }, {
      delimiter: ':'
    }), {
      'hello:world:again': 'good morning'
    })
  })

  test('Empty Objects', function () {
    assert.deepEqual(flatten({
      hello: {
        empty: {
          nested: { }
        }
      }
    }), {
      'hello.empty.nested': { }
    })
  })

  if (typeof Buffer !== 'undefined') {
    test('Buffer', function () {
      assert.deepEqual(flatten({
        hello: {
          empty: {
            nested: Buffer.from('test')
          }
        }
      }), {
        'hello.empty.nested': Buffer.from('test')
      })
    })
  }

  if (typeof Uint8Array !== 'undefined') {
    test('typed arrays', function () {
      assert.deepEqual(flatten({
        hello: {
          empty: {
            nested: new Uint8Array([1, 2, 3, 4])
          }
        }
      }), {
        'hello.empty.nested': new Uint8Array([1, 2, 3, 4])
      })
    })
  }

  test('Custom Depth', function () {
    assert.deepEqual(flatten({
      hello: {
        world: {
          again: 'good morning'
        }
      },
      lorem: {
        ipsum: {
          dolor: 'good evening'
        }
      }
    }, {
      maxDepth: 2
    }), {
      'hello.world': {
        again: 'good morning'
      },
      'lorem.ipsum': {
        dolor: 'good evening'
      }
    })
  })

  test('Should keep number in the left when object', function () {
    assert.deepEqual(flatten({
      hello: {
        '0200': 'world',
        '0500': 'darkness my old friend'
      }
    }), {
      'hello.0200': 'world',
      'hello.0500': 'darkness my old friend'
    })
  })
})

suite('Unflatten', function () {
  test('Nested once', function () {
    assert.deepEqual({
      hello: {
        world: 'good morning'
      }
    }, unflatten({
      'hello.world': 'good morning'
    }))
  })

  test('Nested twice', function () {
    assert.deepEqual({
      hello: {
        world: {
          again: 'good morning'
        }
      }
    }, unflatten({
      'hello.world.again': 'good morning'
    }))
  })

  test('Multiple Keys', function () {
    assert.deepEqual({
      hello: {
        lorem: {
          ipsum: 'again',
          dolor: 'sit'
        }
      },
      world: {
        greet: 'hello',
        lorem: {
          ipsum: 'again',
          dolor: 'sit'
        }
      }
    }, unflatten({
      'hello.lorem.ipsum': 'again',
      'hello.lorem.dolor': 'sit',
      'world.lorem.ipsum': 'again',
      'world.lorem.dolor': 'sit',
      'world': {greet: 'hello'}
    }))
  })

  test('nested objects do not clobber each other when a.b inserted before a', function () {
    var x = {}
    x['foo.bar'] = {t: 123}
    x['foo'] = {p: 333}
    assert.deepEqual(unflatten(x), {
      foo: {
        bar: {
          t: 123
        },
        p: 333
      }
    })
  })

  test('Custom Delimiter', function () {
    assert.deepEqual({
      hello: {
        world: {
          again: 'good morning'
        }
      }
    }, unflatten({
      'hello world again': 'good morning'
    }, {
      delimiter: ' '
    }))
  })

  test('Overwrite', function () {
    assert.deepEqual({
      travis: {
        build: {
          dir: '/home/travis/build/kvz/environmental'
        }
      }
    }, unflatten({
      travis: 'true',
      travis_build_dir: '/home/travis/build/kvz/environmental'
    }, {
      delimiter: '_',
      overwrite: true
    }))
  })

  test('Messy', function () {
    assert.deepEqual({
      hello: { world: 'again' },
      lorem: { ipsum: 'another' },
      good: {
        morning: {
          hash: {
            key: { nested: {
              deep: { and: { even: {
                deeper: { still: 'hello' }
              } } }
            } }
          },
          again: { testing: { 'this': 'out' } }
        }
      }
    }, unflatten({
      'hello.world': 'again',
      'lorem.ipsum': 'another',
      'good.morning': {
        'hash.key': {
          'nested.deep': {
            'and.even.deeper.still': 'hello'
          }
        }
      },
      'good.morning.again': {
        'testing.this': 'out'
      }
    }))
  })

  suite('Overwrite + non-object values in key positions', function () {
    test('non-object keys + overwrite should be overwritten', function () {
      assert.deepEqual(unflatten({ a: null, 'a.b': 'c' }, {overwrite: true}), { a: { b: 'c' } })
      assert.deepEqual(unflatten({ a: 0, 'a.b': 'c' }, {overwrite: true}), { a: { b: 'c' } })
      assert.deepEqual(unflatten({ a: 1, 'a.b': 'c' }, {overwrite: true}), { a: { b: 'c' } })
      assert.deepEqual(unflatten({ a: '', 'a.b': 'c' }, {overwrite: true}), { a: { b: 'c' } })
    })

    test('overwrite value should not affect undefined keys', function () {
      assert.deepEqual(unflatten({ a: undefined, 'a.b': 'c' }, {overwrite: true}), { a: { b: 'c' } })
      assert.deepEqual(unflatten({ a: undefined, 'a.b': 'c' }, {overwrite: false}), { a: { b: 'c' } })
    })

    test('if no overwrite, should ignore nested values under non-object key', function () {
      assert.deepEqual(unflatten({ a: null, 'a.b': 'c' }), { a: null })
      assert.deepEqual(unflatten({ a: 0, 'a.b': 'c' }), { a: 0 })
      assert.deepEqual(unflatten({ a: 1, 'a.b': 'c' }), { a: 1 })
      assert.deepEqual(unflatten({ a: '', 'a.b': 'c' }), { a: '' })
    })
  })

  suite('.safe', function () {
    test('Should protect arrays when true', function () {
      assert.deepEqual(flatten({
        hello: [
            { world: { again: 'foo' } },
           { lorem: 'ipsum' }
        ],
        another: {
          nested: [{ array: { too: 'deep' } }]
        },
        lorem: {
          ipsum: 'whoop'
        }
      }, {
        safe: true
      }), {
        hello: [
            { world: { again: 'foo' } },
           { lorem: 'ipsum' }
        ],
        'lorem.ipsum': 'whoop',
        'another.nested': [{ array: { too: 'deep' } }]
      })
    })

    test('Should not protect arrays when false', function () {
      assert.deepEqual(flatten({
        hello: [
            { world: { again: 'foo' } },
           { lorem: 'ipsum' }
        ]
      }, {
        safe: false
      }), {
        'hello.0.world.again': 'foo',
        'hello.1.lorem': 'ipsum'
      })
    })
  })

  suite('.object', function () {
    test('Should create object instead of array when true', function () {
      var unflattened = unflatten({
        'hello.you.0': 'ipsum',
        'hello.you.1': 'lorem',
        'hello.other.world': 'foo'
      }, {
        object: true
      })
      assert.deepEqual({
        hello: {
          you: {
            0: 'ipsum',
            1: 'lorem'
          },
          other: { world: 'foo' }
        }
      }, unflattened)
      assert(!Array.isArray(unflattened.hello.you))
    })

    test('Should create object instead of array when nested', function () {
      var unflattened = unflatten({
        'hello': {
          'you.0': 'ipsum',
          'you.1': 'lorem',
          'other.world': 'foo'
        }
      }, {
        object: true
      })
      assert.deepEqual({
        hello: {
          you: {
            0: 'ipsum',
            1: 'lorem'
          },
          other: { world: 'foo' }
        }
      }, unflattened)
      assert(!Array.isArray(unflattened.hello.you))
    })

    test('Should keep the zero in the left when object is true', function () {
      var unflattened = unflatten({
        'hello.0200': 'world',
        'hello.0500': 'darkness my old friend'
      }, {
        object: true
      })

      assert.deepEqual({
        hello: {
          '0200': 'world',
          '0500': 'darkness my old friend'
        }
      }, unflattened)
    })

    test('Should not create object when false', function () {
      var unflattened = unflatten({
        'hello.you.0': 'ipsum',
        'hello.you.1': 'lorem',
        'hello.other.world': 'foo'
      }, {
        object: false
      })
      assert.deepEqual({
        hello: {
          you: ['ipsum', 'lorem'],
          other: { world: 'foo' }
        }
      }, unflattened)
      assert(Array.isArray(unflattened.hello.you))
    })
  })

  if (typeof Buffer !== 'undefined') {
    test('Buffer', function () {
      assert.deepEqual(unflatten({
        'hello.empty.nested': Buffer.from('test')
      }), {
        hello: {
          empty: {
            nested: Buffer.from('test')
          }
        }
      })
    })
  }

  if (typeof Uint8Array !== 'undefined') {
    test('typed arrays', function () {
      assert.deepEqual(unflatten({
        'hello.empty.nested': new Uint8Array([1, 2, 3, 4])
      }), {
        hello: {
          empty: {
            nested: new Uint8Array([1, 2, 3, 4])
          }
        }
      })
    })
  }
})

suite('Arrays', function () {
  test('Should be able to flatten arrays properly', function () {
    assert.deepEqual({
      'a.0': 'foo',
      'a.1': 'bar'
    }, flatten({
      a: ['foo', 'bar']
    }))
  })

  test('Should be able to revert and reverse array serialization via unflatten', function () {
    assert.deepEqual({
      a: ['foo', 'bar']
    }, unflatten({
      'a.0': 'foo',
      'a.1': 'bar'
    }))
  })

  test('Array typed objects should be restored by unflatten', function () {
    assert.equal(
        Object.prototype.toString.call(['foo', 'bar'])
      , Object.prototype.toString.call(unflatten({
        'a.0': 'foo',
        'a.1': 'bar'
      }).a)
    )
  })

  test('Do not include keys with numbers inside them', function () {
    assert.deepEqual(unflatten({
      '1key.2_key': 'ok'
    }), {
      '1key': {
        '2_key': 'ok'
      }
    })
  })
})

suite('Coercion', function () {
  test('Should coerce by predicate', function () {
    var coercion = [{
      test: function (key, value) { return key === '_id' },
      transform: function (value) { return 'foo' + value }
    }]
    var options = { coercion: coercion }

    assert.deepEqual(flatten({
      group1: {
        prop1: 'one',
        prop2: 'two',
        _id: 'bar'
      }
    }, options), {
      'group1.prop1': 'one',
      'group1.prop2': 'two',
      'group1._id': 'foobar'
    })
  })

  test('Should coerce by value', function () {
    var coercion = [{
      test: function (key, value) { return value === 'badval' },
      transform: function (value) { return 'goodval' }
    }]
    var options = { coercion: coercion }

    assert.deepEqual(flatten({
      group1: {
        prop1: 'badval'
      }
    }, options), {
      'group1.prop1': 'goodval'
    })
  })

  test('Should allow coercion of objects', function () {
    const SomeObject = function () {
      this.type = 'sometype'
      this.value = 'xxx'
    }

    var coercion = [{
      test: function (key, value) { return value.type === 'sometype' },
      transform: function (value) { return value.value }
    }]
    var options = { coercion: coercion }

    assert.deepEqual(flatten({
      group1: {
        prop1: 'one',
        prop2: 'two',
        _id: new SomeObject()
      }
    }, options), {
      'group1.prop1': 'one',
      'group1.prop2': 'two',
      'group1._id': 'xxx'
    })
  })

  test('Cascading coercion', function () {
    var coercion = [{
      test: function (key, value) { return key === 'prop1' },
      transform: function (value) { return 'one' + value }
    },
    {
      test: function (key, value) { return value === 'one two ' },
      transform: function (value) { return value + 'three' }
    },
    {
      test: function (key, value) { return key === 'prop1' },
      transform: function (value) { return value + ' four' }
    }]
    var options = { coercion: coercion }

    assert.deepEqual(flatten({
      group1: {
        prop1: ' two '
      }
    }, options), {
      'group1.prop1': 'one two three four'
    })
  })
})

suite('Filtering', function () {
  test('Should allow filtering of specific objects so that they are not flattened', function () {
    const SomeObject = function () {
      this.type = 'sometype'
      this.value = 'xxx'
    }

    var filters = [{
      test: function (key, value) { return value.type === 'sometype' }
    }]

    var options = { filters: filters }
    var object = new SomeObject()

    assert.deepEqual(flatten({
      group1: {
        object: object
      }
    }, options), {
      'group1.object': object
    })
  })

  test('Should allow multiple filters', function () {
    const SomeObject = function () {
      this.type = 'secondtype'
      this.value = 'xxx'
    }

    var filters = [
      {
        test: function (key, value) { return value.type === 'firsttype' }
      },
      {
        test: function (key, value) { return value.type === 'secondtype' }
      }
    ]

    var options = { filters: filters }
    var object = new SomeObject()

    assert.deepEqual(flatten({
      group1: {
        object: object
      }
    }, options), {
      'group1.object': object
    })
  })

  test('If filter tests do not pass, object is not filtered', function () {
    const SomeObject = function () {
      this.type = 'sometype'
      this.value = 'xxx'
    }

    var filters = [{
      test: function (key, value) { return value.type === 'othertype' }
    }]

    var options = { filters: filters }
    var object = new SomeObject()

    assert.deepEqual(flatten({
      group1: {
        object: object
      }
    }, options), {
      'group1.object.type': 'sometype',
      'group1.object.value': 'xxx'
    })
  })
})
