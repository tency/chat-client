
function parseIntOrZero(n) {
    let v = parseInt(n); // NaN
    return v ? v : 0;
}

function ajaxPost(url, data, callback) {
    //console.log('url = ' + url);
    let index = 0;
    if (typeof layer != 'undefined') {
        index = layer.load();
    }
    
    $.ajax({
        url: url,
        type: 'POST',
        data: JSON.stringify(data),
        dataType: 'json',
        contentType: 'application/json',
        success: function (resp) {
            if (typeof layer != 'undefined') {
                layer.close(index);
            }
            //console.log(url, 'code = ' + resp.code);
            if (resp.code === 0) {
                callback(null, resp.data); // succeed
            } else {
                callback(resp.msg, null);
            }
        },
        error: function (xhr, opt, err) {
            if (typeof layer != 'undefined') {
                layer.close(index);
            }
            callback(err, null);
        }
    });
}

function GetUrlArgs(sArgName)
{
    var sHref = window.location.search;
    var args    = sHref.split("?");
    var retval = "";
        
    if(args[0] == sHref) /*参数为空*/
    {
        return retval; /*无需做任何处理*/
    }  
    var str = args[1];
    args = str.split("&");
    for(var i = 0; i < args.length; i ++)
    {
        str = args[i];
        var arg = str.split("=");
        if(arg.length <= 1) continue;

        var tmpVal = arg[1]; 
        if (arg.length > 2) {
            var firstIndex = str.indexOf('=');
            tmpVal = str.substr(firstIndex+1,str.length);
        }
            
        if(arg[0] == sArgName) retval = tmpVal; 
    }
    return retval;
}