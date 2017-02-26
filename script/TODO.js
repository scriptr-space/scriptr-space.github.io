// http://stackoverflow.com/questions/24807066/multiple-cursors-in-ace-editor

var marker = {}
marker.cursors = [{row: 0, column: 10}]
marker.update = function(html, markerLayer, session, config) {
    var start = config.firstRow, end = config.lastRow;
    var cursors = this.cursors
    for (var i = 0; i < cursors.length; i++) {
        var pos = this.cursors[i];
        if (pos.row < start) {
            continue
        } else if (pos.row > end) {
            break
        } else {
            // compute cursor position on screen
            // this code is based on ace/layer/marker.js
            var screenPos = session.documentToScreenPosition(pos)

            var height = config.lineHeight;
            var width = config.characterWidth;
            var top = markerLayer.$getTop(screenPos.row, config);
            var left = markerLayer.$padding + screenPos.column * width;
            // can add any html here
            html.push(
                "<div class='MyCursorClass' style='",
                "height:", height, "px;",
                "top:", top, "px;",
                "left:", left, "px; width:", width, "px'></div>"
            );
        }
    }
}
marker.redraw = function() {
   this.session._signal("changeFrontMarker");
}
marker.addCursor = function() {
    // add to this cursors
    ....
    // trigger redraw
    marker.redraw()
}
marker.session = editor.session;
marker.session.addDynamicMarker(marker, true)
// call marker.session.removeMarker(marker.id) to remove it
// call marker.redraw after changing one of cursors

.MyCursorClass {
    position: absolute;
    border-left: 2px solid gold;
}

https://github.com/ajaxorg/ace/blob/master/lib/ace/layer/marker.js 