# 命例库筛选接口需求

## 一、新增接口：查询来源列表

用于前端下拉框展示所有可用来源。

```
GET /api/destiny-cases/sources/
```

### 请求参数

无

### 响应格式

```json
{
  "sources": ["铁口擂台", "巾箱秘术", "神龙杯擂台", "佳佳国学擂台"]
}
```

要求：去重、去空、按数量降序排列（高频来源在前）。

---

## 二、现有接口改造：`GET /api/destiny-cases/` 新增筛选参数

### 新增查询参数

| 参数 | 类型 | 说明 | 示例 |
|------|------|------|------|
| `source` | string | 来源名称，精确匹配 | `source=铁口擂台` |
| `chusheng` | string | 出身（label JSON 内字段），精确匹配 | `chusheng=农村普通家庭` |
| `xueli` | string | 学历，精确匹配 | `xueli=本科` |
| `zhiye_leibie` | string | 职业类别，精确匹配 | `zhiye_leibie=经商` |
| `hunyin_zhuangtai` | string | 婚姻状态，精确匹配 | `hunyin_zhuangtai=离异` |
| `caifu_cengci` | string | 财富层次，精确匹配 | `caifu_cengci=小康` |

所有参数均为可选，互不冲突，可组合使用。与原参数 `gender`、`year_ganzhi`、`month_ganzhi`、`day_ganzhi`、`hour_ganzhi` 联合过滤。

### 请求示例

```
GET /api/destiny-cases/?source=铁口擂台&chusheng=农村普通家庭&xueli=本科&page_size=12
```

### 响应格式

不变，沿用现有 Django REST Framework 分页格式：

```json
{
  "count": 3999,
  "next": "http://minghaishiyi.cn:8000/api/destiny-cases/?page=2&page_size=12&source=...",
  "previous": null,
  "results": [
    {
      "id": 3699,
      "source": "铁口擂台",
      "gender": 0,
      "year_ganzhi": "壬申",
      "month_ganzhi": "壬寅",
      "day_ganzhi": "庚午",
      "hour_ganzhi": "戊寅",
      "feedback": "...",
      "label": "{\"出身\": \"农村普通家庭\", ...}"
    }
  ]
}
```

`next` 和 `previous` 中的 URL 需携带当前所有筛选参数，保证分页一致性。

---

## 三、label JSON 字段说明

后端 `label` 字段当前存储为 JSON 字符串，结构如下：

```json
{
  "出身": "农村普通家庭",
  "学历": "初中",
  "职业类别": "自由职业",
  "职业细分": "不稳定工作-普通打工",
  "婚姻状态": "未婚",
  "子女数量": 0,
  "子女构成": "无",
  "财富层次": "温饱",
  "感情特征": ["感情不顺", "多次分手/分合"]
}
```

筛选涉及的字段及已知枚举值：

| 字段 | 已知值 |
|------|--------|
| 出身 | 农村普通家庭、城市小康家庭、城市普通家庭、富裕家庭 |
| 学历 | 初中、高中、中专、大专、本科、研究生、博士 |
| 职业类别 | 经商、自由职业、国企、私企白领、医教金融、公职 |
| 婚姻状态 | 未婚、已婚(初婚)、离异、二婚 |
| 财富层次 | 温饱、小康、小富、负债 |

---

## 四、实现建议

1. **`source` 参数**：直接对 `source` 字段做数据库级 WHERE 过滤即可。
2. **label 内字段参数**：建议在数据库层对 `label` JSON 列做 `JSON_EXTRACT` 查询（MySQL）或 `->>` 操作符（PostgreSQL），避免全表扫描后在应用层过滤。
3. **sources 接口**：`SELECT DISTINCT source FROM table ORDER BY COUNT(*) DESC`，返回去重排序列表。
4. 所有筛选参数均需做 SQL 注入防护（参数化查询）。
