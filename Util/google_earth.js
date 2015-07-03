/// <reference path="coordinate.ts"/>
var jQuery;
var GoogleEarth = (function () {
    function GoogleEarth() {
        this.ZOOM = 10000000;
    }
    /**
     * Google Earth の初期化処理
     */
    GoogleEarth.prototype.initializeEarth = function () {
        var _this = this;
        var deferred = jQuery.Deferred();
        google.earth.createInstance('map3d', function (instance) {
            _this.ge = instance;
            _this.ge.getWindow().setVisibility(true);
            deferred.resolve();
        }, function (errorCode) {
            alert("Google Earth でエラーが発生しました (errorCode : " + errorCode + ")");
        });
        return deferred.promise();
    };
    /**
     * @param coordinate {Coordinate.Coordinate}
     */
    GoogleEarth.prototype.drawResult = function (coordinate) {
        var placemark = this.ge.createPlacemark('');
        placemark.setName("Optimal Value : " + coordinate.getElevation() + " meters.");
        var style = this.ge.createStyle(''); //create a new style
        style.getIconStyle().setScale(6.0);
        placemark.setStyleSelector(style); //apply the style to the placemark
        var point = this.ge.createPoint('');
        point.setLatitude(coordinate.latitude);
        point.setLongitude(coordinate.longitude);
        placemark.setGeometry(point);
        this.ge.getFeatures().appendChild(placemark);
        var lookAt = this.ge.createLookAt('');
        lookAt.setLatitude(coordinate.latitude);
        lookAt.setLongitude(coordinate.longitude);
        lookAt.setRange(this.ZOOM);
        this.ge.getView().setAbstractView(lookAt);
        placemark = null;
        style = null;
        point = null;
        lookAt = null;
    };
    return GoogleEarth;
})();
//# sourceMappingURL=google_earth.js.map