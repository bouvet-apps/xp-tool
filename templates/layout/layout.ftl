<div class="container">
    <div class="row">
        {{#regions}}
        <div data-portal-region="{{name}}" class="${columns.{{name}} }">
            [#if {{name}}Region?has_content]
                [#list {{name}}Region.components as pageComponent]
                    [@component path=pageComponent.path /]
                [/#list]
            [/#if]
        </div>
        {{/regions}}
    </div>
</div>