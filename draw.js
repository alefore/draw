var draw = {
  count: 15,
  size: 1000,
  image: null,
  history: [],
  view: null,

  start: function () {
    this.image = this.collection([], 0, 1, [0, 0], 1, 0);
    this.createCanvas(500, this.image, function() {});

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
          this_capture.createCanvas(500, this_capture.image, function() {});
        });

    container.append(link);
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
      operation.settings(settings);
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
    draw.createCanvas(500, draw.image,
        function() { draw.runOperation(draw, link, settings, operation); });

    for (var i = 0; i < draw.count; i++) {
      (function (image) {
         operation.handler(draw, image);
         var canvas = draw.createCanvas(200, image,
            function() {
              draw.updateImage(image);
              draw.runOperation(draw, link, settings, operation);
            });
       })(this.image.clone());
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
      { text: 'tweak',
        description: 'Applies small modifications to all points in the figure.',
        settings: function (container) {},
        handler: function(draw, image) { image.tweak(); } },
      { text: 'mutate',
        description: 'Changes one randomly selected point in the figure.',
        handler: function(draw, image) { image.mutate(); } },
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

  createCanvas: function(size, image, clickHandler) {
    console.log('Creating canvas of size: ' + size);
    var canvas = document.createElement('canvas');
    canvas.setAttribute('class', 'canvas');
    canvas.setAttribute('width', size);
    canvas.setAttribute('height', size);
    canvas.addEventListener('click', clickHandler);
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
        var variation = 0.2;
        for (var i = 0; i < points.length; i++) {
          var factor = 1.0 - variation + 2 * variation * draw.random();
          points[i] = Math.max(0, Math.min(draw.size, points[i] * factor));
        }
      },
      mutate: function() {
        var point = Math.floor(draw.random() * points.length / 2)
        points[point * 2] = draw.random() * draw.size;
        points[point * 2 + 1] = draw.random() * draw.size;
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
        var choice = draw.random();
        if (choice < 0.3) {
          translateBox[0][0] += draw.size * (-0.2 + draw.random() * 0.4);
          translateBox[0][1] += draw.size * (-0.2 + draw.random() * 0.4);
        } else {
          shapes[activeBox[0]].tweak();
        }
      },
      mutate: function() { shapes[activeBox[0]].mutate(); },
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
    this.history.push(this.image);
    this.image = image;
    var parts = [];
    image.toString(parts);
    $('#code').val(parts.join(''));
  },

  load: function() {
    this.updateImage(eval($('#code').val()));
    $('canvas').remove();
    this.createCanvas(500, this.image, function() {});
  },
};
