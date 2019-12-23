<?php
header('Access-Control-Allow-Origin:*');
header('Access-Control-Allow-Methods:POST');
header('Access-Control-Allow-Headers:x-requested-with,content-type');
header('Content-Type: application/json');

error_reporting(0);


$resp = array(code=>0, msg=>'suss', data=>array(src=>''));

//判断上传的文件是否出错,是的话，返回错误
if($_FILES["file"]["error"])
{
	$resp['code'] = 1;
	$resp['msg'] = $_FILES["file"]["error"]; 
}
else
{
    //没有出错
    //加限制条件
    //判断上传文件类型为png或jpg且大小不超过200K
    $extensions = array("image/png", "image/jpeg", "image/bmp", "image/gif", "image/x-icon");
    if(in_array($_FILES["file"]["type"], $extensions) && $_FILES["file"]["size"] < 200*1024)
    {
            //防止文件名重复
            $filename = time().$_FILES["file"]["name"];
            $filename =iconv("UTF-8","gb2312", $filename);
            $filepath = dirname(__FILE__) . '/upload/' . $filename;
             //检查文件或目录是否存在
            if(file_exists($filepath))
            {
				$resp['code'] = 2;
				$resp['msg'] = "该文件已存在"; 
            }
            else
            {  
                //保存文件,   move_uploaded_file 将上传的文件移动到新位置  
                $ok = move_uploaded_file($_FILES["file"]["tmp_name"], $filepath);
                if ($ok) {
                    $resp['data']['src'] = 'http://www.tap2joy.com/upload/'.$filename;
                } else {
                    $resp['code'] = 4;
                    $resp['msg'] = "无法保存文件" . $filepath;
                }
            }        
    }
    else
    {
		$resp['code'] = 3;
		$resp['msg'] = "文件类型不对";
    }
}

echo json_encode($resp);