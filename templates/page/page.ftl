[#macro main]
<!DOCTYPE html>
<html lang="${locale!'no'}">
<head>
    <meta charset="utf-8"/>
    <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
    <meta name="viewport" content="width=device-width, initial-scale=1"/>
    <!-- The above 3 meta tags *must* come first in the head; any other head content must come *after* these tags -->
</head>

<body data-portal-component-type="page">
    <main data-portal-component-type="region" data-portal-region="main">
        [#nested /]
    </main>
</body>
</html>
[/#macro]

[@main]
 [#if isFragment!false]
   [@component path="fragment" /]
 [#elseif regions?has_content]
   [#list regions.components as pageComponent]
     [@component path=pageComponent.path /]
   [/#list]
 [/#if]
[/@main]
