- **{{name}}**:
    ::: .description
    {{description}}
   
    {{#if image}}
    {{#each image}}
    ![{{../name}}]({{{this}}} "{{../name}}")
    {{/each}}
    {{/if}}
    :::
    <table>
        <tr><th>Type</th><th>Påkrevd</th><th>Minimum</th><th>Maksimum</th></tr>
        <tr><td>{{type}}</td><td>{{requiredText}}</td><td>{{min}}</td><td>{{max}}</td></tr>
    </table>

  {{#if configOptions.length}}
  - ##### Valgmuligheter
    ::: .configOptions
    {{#configOptions}}
    - ***{{option}}*** {{description}}
    {{/configOptions}}
    
    :::
  {{/if}}

  {{#if options.length}}
  - ##### Valgmuligheter
  {{/if}}

  {{#options}}
  - ###### {{label}}:
    {{description}}

    {{#if image}}
    {{#each image}}
    ![{{../name}}]({{{this}}} "{{../name}}")
    {{/each}}
    {{/if}}

    {{#fields}}
    {{> field.md }}
    {{/fields}}
  {{/options}}

  {{#items}}

  {{> field.md}}

  {{/items}}
