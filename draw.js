var draw = {
  count: 15,
  size: 1000,
  image: null,
  history: [],
  view: null,

  start: function () {
    this.image = this.collection([], 0, 1, [0, 0], 1, 0);
    this.createDefaultCanvas();

    var container = $('<p>Tools: </p>');
    $('#operations').append(container);

    var draw = this;
    this.operations.forEach(
      function (o) { draw.addOperation(draw, container, o); });

    var link = document.createElement('a');
    link.appendChild(document.createTextNode('back'));
    link.setAttribute('href', '#');

    var this_capture = this;
    link.addEventListener(
        'click',
        function () {
          if (this_capture.history.length == 0) { return; }
          this_capture.image = this_capture.history.pop();
          $('canvas').remove();
          this_capture.createDefaultCanvas();
        });

    container.append(link);
    $('a.operation').first().click();
  },

  randomSeed: 1,
  random: function() {
    var x = Math.sin(this.randomSeed++) * 10000;
    return x - Math.floor(x);
  },

  addOperation: function(draw, container, operation) {
    console.log('Adding operation: ' + operation.text);
    var settings = null;

    if (operation.settings != null) {
      settings = $('<div>')
          .attr('class', 'operationSettings')
          .hide();
      var form = $('<form>');
      settings.append(form);
      operation.settings(draw, form);
      $('#operations').append(settings);
    }

    var link = $('<a>')
        .append(document.createTextNode(operation.text))
        .attr('href', '#')
        .attr('title', operation.description)
        .attr('class', 'operation')
        .on('click',
            function () {
              draw.runOperation(draw, link, settings, operation);
            });

    container.append(link).append(' ');

  },

  runOperation: function(draw, link, settings, operation) {
    console.log('Running operation: ' + operation.text);

    $('a.operation').toggleClass('active', false);
    link.toggleClass('active');

    $('div.operationSettings').hide();
    if (settings != null) {
      settings.show();
    }

    $('canvas').remove();
    draw.createDefaultCanvas();

    for (var i = 0; i < draw.count; i++) {
      var image = this.image.clone();
      operation.handler(draw, image);
      draw.createCanvas(200, image);
    }
  },

  createSetting: function(container, data, element) {
    var span = $('<span>')
        .attr('class', 'setting');
    if (data.name != null) {
      span.append(data.name + ': ');
    }
    span.append(element);
    if (data.description != null) {
      span.attr('title', data.description);
    }
    container.append(span);
  },

  settings: {
    number: function(draw, container, data) {
      var element = $('<input type=number>').attr('id', data.id);
      if (data.step != null) {
        element.attr('step', data.step);
      }
      if (data.initialValue != null) {
        element.val(data.initialValue);
      }
      draw.createSetting(container, data, element);
    },

    selector: function(draw, container, data) {
      var element = $('<select>').attr('id', data.id);
      data.options.forEach(
          function(o) {
            element.append($('<option>').attr('value', o.id).append(o.text));
          });
      draw.createSetting(container, data, element);
    }
  },

  operations: [
      { text: 'add',
        description: 'Adds a new segment.',
        handler: function(draw, image) {
          image.add();
        } },
      { text: 'rm',
        description: 'Removes the active segment.',
        handler: function(draw, image) {
          image.rm();
        } },
      { text: 'active',
        description: 'Toggles the active segment (affected by other commands).',
        handler: function(draw, image) {
          image.active();
        } },
      { text: 'points',
        description:
            'Moves points in the active segment by a random distance.'
            + ' This includes both visible points as well as the control '
            + ' points of the bezier.',
        settings: function (draw, form) {
          draw.settings.number(
              draw,
              form,
              { name: 'Distance X', id: 'tweakDistanceX', initialValue: 0.1,
                step: 0.02, });
          draw.settings.number(
              draw,
              form,
              { name: 'Distance Y', id: 'tweakDistanceY', initialValue: 0.1,
                step: 0.02, });
          draw.settings.selector(
              draw,
              form,
              { id: 'tweakPoints',
                options: [
                  { id: 'one', text: 'Only one point' },
                  { id: 'all', text: 'All points' }]});
        },
        handler: function(draw, image) { image.tweak(); } },
      { text: 'move',
        description: '',
        settings: function (draw, form) {
          draw.settings.number(
              draw,
              form,
              { name: 'Distance X', id: 'moveTranslateDistanceX',
                initialValue: 0.1, step: 0.02, });
          draw.settings.number(
              draw,
              form,
              { name: 'Distance Y', id: 'moveTranslateDistanceY',
                initialValue: 0.1, step: 0.02, });
        },
        handler: function(draw, image) { image.move(); } },
      { text: 'effect',
        description: '',
        handler: function(draw, image) { image.effect(); } },
      { text: 'extend',
        description: 'Extends one of the segments in the figure.',
        handler: function(draw, image) { image.extend(); } },
      { text: 'group',
        description: '',
        handler: function(draw, image) { image.group(); } },
  ],

  createCanvas: function(size, image) {
    console.log('Creating canvas of size: ' + size);
    var canvas = document.createElement('canvas');
    canvas.setAttribute('class', 'canvas');
    canvas.setAttribute('width', size);
    canvas.setAttribute('height', size);

    var this_capture = this;
    canvas.addEventListener('click',
        function() {
          this_capture.updateImage(image);
          $('a.operation.active').click();
        });

    this.drawCanvas(canvas.getContext("2d"), image);
    document.getElementById('boxes').appendChild(canvas);
  },

  randomBezier: function() {
    var points = [];
    for (var i = 0; i < 2; i++) {
      points.push(this.random() * this.size);
    }
    var output = this.bezier(points);
    output.extend();
    return output;
  },

  bezier: function(points) {
    var draw = this;
    return {
      clone: function() {
        return draw.bezier(points.slice());
      },
      toString: function(output) {
        output.push('draw.bezier([');
        points.forEach(function (d) { output.push(Math.floor(d) + ', '); });
        output.push('])');
      },
      active: function() {},
      tweak: function() {
        var pointsIndices = [];
        if ($('#tweakPoints').val() == 'all') {
          for (var i = 0; i < points.length / 2; i++) {
            pointsIndices.push(i);
          }
        } else {
          pointsIndices.push(Math.floor(draw.random() * points.length / 2));
        }

        var randomizePoint = function(index, variation) {
          var delta = draw.size * (-variation + 2 * variation * draw.random());
          points[index] =
              Math.max(0, Math.min(draw.size, points[index] + delta));
        }
        var variationX = Number($('#tweakDistanceX').val());
        var variationY = Number($('#tweakDistanceY').val());
        for (var i = 0; i < pointsIndices.length; i++) {
          randomizePoint(pointsIndices[i] * 2, variationX);
          randomizePoint(pointsIndices[i] * 2 + 1, variationY);
        }
      },
      effect: function() {},
      extend: function() {
        for (var i = 0; i < 6; i++) {
          points.push(draw.random() * draw.size);
        }
      },
      draw: function(canvas, active) {
        canvas.strokeStyle = active ? "#ff0000" : "#ffffff";
        canvas.beginPath();
        canvas.moveTo(points[0], points[1]);
        for (var i = 2; i < points.length; i += 6) {
          canvas.bezierCurveTo(
              points[i + 0], points[i + 1],
              points[i + 2], points[i + 3],
              points[i + 4], points[i + 5]);
        }
        canvas.stroke();
      },
    };
  },

  collection: function(shapes, active, times, translate, scale, angle) {
    var draw = this;
    var activeBox = [active];
    var timesBox = [times];
    var translateBox = [translate];
    var scaleBox = [scale];
    var angleBox = [angle];
    return {
      clone: function() {
        var newShapes = [];
        shapes.forEach(function (s) { newShapes.push(s.clone()); });
        return draw.collection(
            newShapes, activeBox[0], timesBox[0], translateBox[0].slice(),
            scaleBox[0], angleBox[0]);
      },
      toString: function(output) {
        output.push('draw.collection([');
        shapes.forEach(function (s) { s.toString(output); output.push(', '); });
        output.push('], ' + activeBox[0]);
        output.push(', ' + timesBox[0]);
        output.push(
            ', [' + translateBox[0][0] + ', ' + translateBox[0][1] + ']');
        output.push(', ' + scaleBox[0]);
        output.push(', ' + angleBox[0]);
        output.push(')');
      },
      add: function() {
        shapes.push(
            draw.collection([draw.randomBezier()], 0, 1, [0, 0], 1, 0.0));
        activeBox[0] = shapes.length - 1;
      },
      rm: function() {
        shapes.splice(activeBox[0], 1);
        activeBox[0] = shapes.length - 1;
      },
      active: function() {
        // Switch the active shape.
        activeBox[0] = Math.floor(draw.random() * shapes.length);
        shapes[activeBox[0]].active();
      },
      group: function() {
        shapes[0] = draw.collection(shapes.slice(), 0, 1, [0, 0], 1, 0.0);
        shapes.length = 1
        activeBox[0] = 0;
      },
      tweak: function() {
        shapes[activeBox[0]].tweak();
      },
      move: function() {
        var translateVariationX = Number($('#moveTranslateDistanceX').val());
        var translateVariationY = Number($('#moveTranslateDistanceY').val());
        translateBox[0][0] += draw.size
            * (-translateVariationX + 2 * translateVariationX * draw.random());
        translateBox[0][1] += draw.size
            * (-translateVariationY + 2 * translateVariationY * draw.random());
      },
      effect: function() {
        var choice = draw.random();
        if (choice < 0.25) {
          // Adjust repetitions.
          timesBox[0] =
              Math.max(1, timesBox[0] - 5 + Math.floor(draw.random() * 10));
        } else if (choice < 0.5) {
          // Adjust scale.
          scaleBox[0] += -0.5 + Math.floor(draw.random());
          scaleBox[0] = Math.max(0.1, Math.min(1.0, scaleBox[0]));
        } else if (choice < 0.75) {
          angleBox[0] += -0.5 + Math.floor(draw.random());
        } else {
          shapes[activeBox[0]].effect();
        }
      },
      extend: function() {
        shapes[activeBox[0]].extend();
      },
      draw: function(canvas, active) {
        canvas.save();
        canvas.lineJoin = "round";
        canvas.lineWidth = 5;
        for (var times = 0; times < timesBox[0]; times++) {
          canvas.translate(translateBox[0][0], translateBox[0][1]);
          canvas.rotate(angleBox[0]);
          canvas.scale(scaleBox[0], scaleBox[0]);
          for (var i = 0; i < shapes.length; i++) {
            shapes[i].draw(canvas, active && i == activeBox[0]);
          }
        }
        canvas.restore();
      },
    };
  },

  randomImage: function() {
    var output = this.collection([], 0, 1, [0, 0], 1, 0);
    output.add();
    return output;
  },

  drawCanvas: function(canvas, image) {
    canvas.fillStyle = "#000000";
    canvas.fillRect(0, 0, canvas.canvas.width, canvas.canvas.height);

    canvas.save();
    canvas.scale(canvas.canvas.width / this.size,
                 canvas.canvas.height / this.size);
    image.draw(canvas, true);
    canvas.restore();
  },

  updateImage: function(image) {
    if (image == this.image) { return; }
    this.history.push(this.image);
    this.image = image;
    var parts = [];
    image.toString(parts);
    $('#code').val(parts.join(''));
  },

  createDefaultCanvas: function() {
    this.createCanvas(500, this.image);
  },

  load: function() {
    this.updateImage(eval($('#code').val()));
    $('canvas').remove();
    this.createDefaultCanvas();
  },
};
