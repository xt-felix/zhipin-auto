## 使用方法

1. 打开 Chrome → 扩展程序 → 管理扩展程序 → 开启「开发者模式」。
2. 选择「加载已解压的扩展程序」，选择本目录 `/Users/Zhuanz/Desktop/插件`。
3. 打开 `https://www.zhipin.com` 任意页面，插件会在右下角显示浮层。
4. 当页面通过 `fetch` 或 `XMLHttpRequest` 调用 `https://www.zhipin.com/wapi/zpjob/rec/geek/list` 接口时，浮层会显示该请求返回的数据。

注意：Boss 直聘接口可能需要登录状态，未登录会返回：

```
{"code":7,"message":"当前登录状态已失效","zpData":{}}
```

参考接口：`https://www.zhipin.com/wapi/zpjob/rec/geek/list`


