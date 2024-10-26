import os
import re
from datetime import datetime

# 获取当前时间并格式化
current_time = datetime.now().strftime("%Y/%m/%d %H:%M:%S")

# 读取当前目录下的所有.md文件（除了readme.md）
md_files = [f for f in os.listdir('.') if f.endswith('.md') and f != 'readme.md']

# 准备要写入readme.md的内容
readme_content = [
    "---",
    "title: Demo",
    f"createTime: {current_time}",
    "permalink: /demo/",
    "---"
]

# 用于存储完整标题的列表
full_titles = []

# 定义一个函数来处理标题
def process_title(title):
    # 使用正则表达式匹配“第X章 名称”这样的模式
    match = re.match(r'第(\d+)章 (.+)', title)
    if match:
        chapter_number = int(match.group(1))
        chapter_name = match.group(2).upper()  # 将章节名称转换为全大写
        return (chapter_number, chapter_name)
    else:
        print(f"无法匹配标题: {title}")
    return None

# 用于存储标题元组（章节号，标题名，文件名）的列表
titles_list = []

for md_file in md_files:
    try:
        with open(md_file, 'r', encoding='utf-8') as file:
            lines = file.readlines()
            # 跳过YAML front matter
            in_front_matter = False
            for line in lines:
                stripped_line = line.strip()
                if stripped_line == '---':
                    if in_front_matter:
                        in_front_matter = False
                    else:
                        in_front_matter = True
                    continue
                if not in_front_matter and stripped_line.startswith('#'):
                    # 读取第一行作为标题
                    title = stripped_line.lstrip('#').strip()
                    print(f"读取文件 {md_file} 的标题: {title}")
                    # 处理标题
                    title_info = process_title(title)
                    if title_info:
                        # 添加到标题列表中
                        titles_list.append((title_info[0], title_info[1], md_file))
                        # 保存完整的标题
                        full_titles.append(f"第{title_info[0]}章 {title_info[1].upper()}")
                        print(f"成功处理标题: 第{title_info[0]}章 {title_info[1].upper()}")
                        break
                    else:
                        print(f"文件 {md_file} 标题处理失败")
                        break
    except Exception as e:
        print(f"读取文件 {md_file} 时出错: {e}")

# 根据章节号排序
titles_list.sort(key=lambda x: x[0])

# 构造readme内容
for chapter_number, chapter_name, filename in titles_list:
    readme_content.append(f"- [{chapter_name.upper()}](./{filename})")  # 确保链接格式正确

try:
    # 将内容写入到readme.md
    with open('readme.md', 'w', encoding='utf-8') as readme:
        readme.write('\n'.join(readme_content))
    print("readme.md 已更新")
except Exception as e:
    print(f"写入readme.md时出错: {e}")

# 对 full_titles 进行排序
full_titles.sort(key=lambda x: int(re.search(r'第(\d+)章', x).group(1)))

print("完整标题数组:", full_titles)