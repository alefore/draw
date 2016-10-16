var draw = {
  count: 15,
  size: 1000,
  image: null,
  history: [],
  view: null,

  start: function () {
    this.image = this.family({collections: [], active: 0});
    this.createDefaultCanvas();

    var container = $('<p>');
    $('#operations').append(container);

    var draw = this;
    this.operations.forEach(
      function (o) { draw.addOperation(draw, container, o); });

    var this_capture = this;
    this.createToolLink(container, 'back', '',
        function () {
          if (this_capture.history.length == 0) { return; }
          this_capture.image = this_capture.history.pop();
          $('canvas').remove();
          this_capture.createDefaultCanvas();
        });

    $('a.operation').first().click();
  },

  randomSeed: 1,
  random: function() {
    var x = Math.sin(this.randomSeed++) * 10000;
    return x - Math.floor(x);
  },

  createToolLink: function(container, text, description, handler) {
    var link = $('<a>')
        .append(document.createTextNode(text))
        .attr('href', '#')
        .attr('title', description)
        .attr('class', 'operation')
        .on('click',
            function() {
              $('a.operation').toggleClass('active', false);
              link.toggleClass('active');
              handler();
            });
    container.append(link).append(' ');
  },

  addOperation: function(draw, container, operation) {
    console.log('Adding operation: ' + operation.text);
    var settings = null;

    if (operation.settings != null && operation.settings.length > 0) {
      settings = $('<div>')
          .attr('class', 'operationSettings')
          .hide();
      var form = $('<form>');
      settings.append(form);
      operation.settings.forEach(
          function (setting) {
            draw.settingsHtml[setting.type](draw, form, setting);
          });
      $('#operations').append(settings);
    }

    this.createToolLink(container, operation.text, operation.description,
        function (link) {
          draw.runOperation(draw, settings, operation);
        });
  },

  runOperation: function(draw, settings, operation) {
    console.log('Running operation: ' + operation.text);

    $('div.operationSettings').hide();
    if (settings != null) {
      settings.show();
    }

    $('canvas').remove();
    draw.createDefaultCanvas();

    for (var i = 0; i < draw.count; i++) {
      var image = this.image.clone();
      operation.handler(draw, image);
      draw.createCanvas(250, image);
    }
  },

  createSetting: function(container, data, element, checkbox) {
    var span = $('<span>').attr('class', 'setting');
    var nameTarget = span;
    if (data.checkbox != null) {
      nameTarget = $('<label>')
          .append($('<input type=checkbox>')
              .attr('id', data.id + 'checkbox')
              .prop('checked', true)
              .click(function() { $('a.operation.active').click(); }));
      span.append(nameTarget);
    }
    if (data.name != null) {
      nameTarget.append(data.name + ': ');
    }
    span.append(element);
    if (data.description != null) {
      span.attr('title', data.description);
    }
    container.append(span);
  },

  settingsHtml: {
    number: function(draw, container, data) {
      var element = $('<input type=number>')
          .attr('id', data.id);
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
            element.append($('<option>')
                .attr('value', o.id)
                .append(o.text));
          });
      element.change(function() { $('a.operation.active').click(); });
      draw.createSetting(container, data, element);
    },
  },

  operations: [
      { text: 'add',
        description: 'Adds a new segment or collection.',
        settings: [
            { type: 'selector',
              id: 'addType',
              options: [
                  { id: 'segment', text: 'Segment' },
                  { id: 'collection', text: 'Collection' }]}],
        handler: function(draw, image) {
          image.add($('#addType option:selected').val());
        }},
      { text: 'rm',
        description: 'Removes the active segment.',
        handler: function(draw, image) {
          image.rm();
        } },
      { text: 'active',
        description: 'Toggles the active segment or collection.',
        settings: [
            { type: 'selector',
              id: 'activeType',
              options: [
                  { id: 'segment', text: 'Segment' },
                  { id: 'collection', text: 'Collection' }]}],
        handler: function(draw, image) {
          image.active($('#activeType option:selected').val()); } },
      { text: 'tweak',
        description:
            'Moves points in the active segment by a random distance.'
            + ' This includes both visible points as well as the control '
            + ' points of the bezier.',
        settings: [
            { type: 'number',
              name: 'Distance X',
              id: 'tweakDistanceX',
              checkbox: true,
              initialValue: 0.1,
              step: 0.02 },
            { type: 'number',
              name: 'Distance Y',
              id: 'tweakDistanceY',
              checkbox: true,
              initialValue: 0.1,
              step: 0.02 },
            { type: 'selector',
              id: 'tweakSelectPoints',
              options: [
                  { id: 'all', text: 'All' },
                  { id: 'control', text: 'Control' },
                  { id: 'path', text: 'Path' }]},
            { type: 'selector',
              name: 'Points',
              id: 'tweakPoints',
              options: [
                  { id: 'one', text: 'One' },
                  { id: 'all', text: 'All' }]}],
        handler: function(draw, image) { image.tweak(); } },
      { text: 'transform',
        description: '',
        settings: [
            {type: 'selector',
             name: 'Target',
             id: 'transformTarget',
             options: [
                 {id: 'all', text: 'All'},
                 {id: 'loop', text: 'Loop'}]},
            { type: 'number',
              name: 'Distance X',
              id: 'moveTranslateDistanceX',
              checkbox: true,
              initialValue: 0.1,
              step: 0.02 },
            { type: 'number',
              name: 'Distance Y',
              id: 'moveTranslateDistanceY',
              checkbox: true,
              initialValue: 0.1,
              step: 0.02 },
            { type: 'number',
              name: 'Scale',
              id: 'moveScale',
              checkbox: true,
              initialValue: 0.1,
              step: 0.02 },
            { type: 'number',
              name: 'Angle',
              id: 'moveAngle',
              checkbox: true,
              initialValue: 0.1,
              step: 0.02 }],
        handler: function(draw, image) { image.transform(); } },
      { text: 'effect',
        description: '',
        handler: function(draw, image) { image.effect(); } },
      { text: 'group',
        description: '',
        handler: function(draw, image) { image.group(); } },
  ],

  createCanvas: function(size, image) {
    console.log('Creating canvas of size: ' + size);
    var this_capture = this;
    var canvas = $('<canvas>')
        .attr('width', size)
        .attr('height', size)
        .click(
            function() {
              this_capture.updateImage(image);
              $('a.operation.active').click();
            })
        .mouseover(
            function() {
              this_capture.drawCanvas($('canvas').get(0), image);
            })
        .mouseout(
            function() {
              this_capture.drawCanvas($('canvas').get(0), this_capture.image);
            });

    this.drawCanvas(canvas.get(0), image);
    $('#boxes').append(canvas);
  },

  randomNewPoint: function(points) {
    points.push([this.random() * this.size, this.random() * this.size]);
    return points.length - 1;
  },

  randomPoint: function(points) {
    if (points.length == 0 || this.random() < 0.8) {
      return this.randomNewPoint(points);
    }
    return Math.floor(this.random() * points.length);
  },


  bezier: function(data) {
    var draw = this;
    return {
      tweak: function() {
      },
    };
  },

  family: function(data) {
    console.log('Create family: ' + JSON.stringify(data));
    var draw = this;
    return {
      clone: function() {
        var newCollections = [];
        data.collections.forEach(
            function (c) { newCollections.push(c.clone()); });
        return draw.family({collections: newCollections, active: data.active});
      },
      toString: function(output) {
        output.push('draw.family({collections: [');
        data.collections.forEach(function (c) {
          c.toString(output);
          output.push(', ');
        });
        output.push('], active: ' + data.active);
        output.push('})');
      },
      add: function(addType) {
        if (data.collections.length == 0 || addType == 'collection') {
          data.collections.push(draw.collection({
            shapes: [],
            active: 0,
            loop: {times: 1, transform: draw.defaultTransform()},
            transform: draw.defaultTransform(),
            frozen: false,
            points: {path: [], control: []}}));
          data.active = data.collections.length - 1;
        }
        data.collections[data.active].add();
      },
      rm: function() {
        data.collections[data.active].rm();
      },
      active: function(addType) {
        if (addType == 'segment') {
          data.collections[data.active].active();
          return;
        }
        data.active = Math.floor(draw.random() * data.collections.length);
      },
      tweak: function() {
        data.collections[data.active].tweak();
      },
      transform: function() {
        data.collections[data.active].transform();
      },
      effect: function() {
        data.collections[data.active].effect();
      },
      draw: function(canvas, active) {
        for (var i = 0; i < data.collections.length; i++) {
          data.collections[i].draw(canvas, i == data.active);
        }
      },
    };
  },

  defaultTransform: function() {
    return {translate: [0, 0], scale: 1.0, angle: 0};
  },

  getSettingsNumberWithCheckbox: function(id) {
    return $('#' + id + 'checkbox').prop('checked')
        ? Number($('#' + id).val()) : 0;
  },

  collection: function(data) {
    console.log('Create collection: ' + JSON.stringify(data));
    var draw = this;
    return {
      clone: function() {
        return draw.collection($.extend(true, {}, data));
      },
      toString: function(output) {
        output.push('draw.collection(');
        output.push(JSON.stringify(data));
        output.push(')');
      },
      add: function() {
        data.shapes.push({
          pathStart: draw.randomPoint(data.points.path),
          controlStart: draw.randomNewPoint(data.points.control),
          controlEnd: draw.randomNewPoint(data.points.control),
          pathEnd: draw.randomPoint(data.points.path)
        });
        data.active = data.shapes.length - 1;
      },
      rm: function() {
        data.shapes.splice(data.active, 1);
        data.active = data.shapes.length - 1;
      },
      active: function() {
        data.active = Math.floor(draw.random() * data.shapes.length);
      },
      tweak: function() {
        // We will push tuples of the form [a, b], where a is either 'path' or
        // 'points', depending on which type of point we're modifying, and b is
        // the index into the list.
        var pointsIndices = [];

        var shape = data.shapes[data.active];

        if ($('#tweakSelectPoints').val() != 'control') {
          console.log('Adding path points');
          pointsIndices.push(['path', shape.pathStart]);
          pointsIndices.push(['path', shape.pathEnd]);
        }

        if ($('#tweakSelectPoints').val() != 'path') {
          console.log('Adding control points');
          pointsIndices.push(['control', shape.controlStart]);
          pointsIndices.push(['control', shape.controlEnd]);
        }

        if ($('#tweakPoints').val() != 'all') {
          pointsIndices =
              [pointsIndices[Math.floor(draw.random() * pointsIndices.length)]];
        }

        var randomizePoint = function(entry, dimension, variation) {
          var delta = draw.size * (-variation + 2 * variation * draw.random());
          data.points[entry[0]][entry[1]][dimension] += delta;
        }
        var variationX = draw.getSettingsNumberWithCheckbox('tweakDistanceX');
        var variationY = draw.getSettingsNumberWithCheckbox('tweakDistanceY');
        console.log('Options: ' + pointsIndices.length)
        for (var i = 0; i < pointsIndices.length; i++) {
          randomizePoint(pointsIndices[i], 0, variationX);
          randomizePoint(pointsIndices[i], 1, variationY);
        }
      },
      transform: function() {
        if (!data.frozen && data.shapes[data.active].transform != null) {
          data.shapes[data.active].transform();
          return;
        }

        var target = $('#transformTarget').val() == 'all'
            ? data.transform : data.loop.transform;

        var translateVariationX =
            draw.getSettingsNumberWithCheckbox('moveTranslateDistanceX');
        var translateVariationY =
            draw.getSettingsNumberWithCheckbox('moveTranslateDistanceY');
        target.translate[0] += draw.size
            * (-translateVariationX + 2 * translateVariationX * draw.random());
        target.translate[1] += draw.size
            * (-translateVariationY + 2 * translateVariationY * draw.random());

        var moveScaleVariation =
            draw.getSettingsNumberWithCheckbox('moveScale');
        target.scale +=
            -moveScaleVariation + 2 * moveScaleVariation * draw.random();

        var moveAngleVariation =
            draw.getSettingsNumberWithCheckbox('moveAngle');
        target.angle +=
            -moveAngleVariation + 2 * moveAngleVariation * draw.random();

      },
      effect: function() {
        if (!data.frozen && data.shapes[data.active].effect != null) {
          data.shapes[data.active].effect();
          return;
        }
        data.loop.times =
            Math.max(1, data.loop.times - 5 + Math.floor(draw.random() * 10));
      },
      draw: function(canvas, active) {
        canvas.save();
        canvas.lineJoin = "round";
        canvas.lineWidth = 5;
        for (var times = 0; times < data.loop.times; times++) {
          var transform = times == 0 ? data.transform : data.loop.transform;
          canvas.translate(transform.translate[0], transform.translate[1]);

          canvas.translate(draw.size / 2, draw.size / 2);
          canvas.rotate(transform.angle);
          canvas.translate(-draw.size / 2, -draw.size / 2);

          canvas.scale(transform.scale, transform.scale);
          for (var i = 0; i < data.shapes.length; i++) {
            var shape = data.shapes[i];
            if (!active) {
              canvas.strokeStyle = "#ffffff";
            } else if (i == data.active) {
              canvas.strokeStyle = "#ff0000";
            } else {
              canvas.strokeStyle = "#ffaaaa";
            }
            canvas.beginPath();
            canvas.moveTo(
                data.points.path[shape.pathStart][0],
                data.points.path[shape.pathStart][1]);
            canvas.bezierCurveTo(
                data.points.control[shape.controlStart][0],
                data.points.control[shape.controlStart][1],
                data.points.control[shape.controlEnd][0],
                data.points.control[shape.controlEnd][1],
                data.points.path[shape.pathEnd][0],
                data.points.path[shape.pathEnd][1]);
            canvas.stroke();
          }
        }
        canvas.restore();
      },
    };
  },

  randomImage: function() {
    var output = this.family({collections: [], active: 0});
    output.add('collection');
    output.add('segment');
    return output;
  },

  drawCanvas: function(canvas, image) {
    canvas = canvas.getContext('2d');
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
