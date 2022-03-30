### {{displayName}}

::: .description
{{summary}}
:::

{{#if image}}
{{#each image}}
![{{../displayName}}]({{{this}}} "{{../displayName}}")
{{/each}}
{{/if}}

#### Content fields

{{#fields}}
{{> field.md }}
{{/fields}}

