var ECity = {};
ECity.ConfigLoader = function(opt_options) {
    this.config_ = null;
    this.loadConfig_();
};

$.extend(ECity.ConfigLoader.prototype, {
    loadConfig_: function() {
      var me = this;
      $.ajax({
          async: false,
          url: "/json/config.json",
          type: 'GET',
          dataType: 'json',
      }).done(function(data) {
          me.config_ = data;

      }).fail(function(data, status, desc) {
          alert("无法获取配置信息或配置信息有误！");
          throw new Error(status + "\n" + desc);
      });
    },

    getConfig: function() {
        return this.config_;
    }
});