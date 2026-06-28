CREATE TABLE chart_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    saved_query_id UUID REFERENCES saved_queries(id) ON DELETE CASCADE,
    generator_message_id UUID REFERENCES generator_messages(id) ON DELETE CASCADE,
    sql_editor_tab_id UUID REFERENCES sql_editor_tabs(id) ON DELETE CASCADE,
    chart_type VARCHAR(20) NOT NULL,
    x_axis_column VARCHAR(255) NOT NULL,
    y_axis_columns TEXT[] NOT NULL,
    category_column VARCHAR(255),
    config JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT chk_chart_reference CHECK (
        saved_query_id IS NOT NULL
        OR generator_message_id IS NOT NULL
        OR sql_editor_tab_id IS NOT NULL
    )
);

CREATE INDEX idx_chart_configs_sq ON chart_configs(saved_query_id);
CREATE INDEX idx_chart_configs_gm ON chart_configs(generator_message_id);
CREATE INDEX idx_chart_configs_se ON chart_configs(sql_editor_tab_id);