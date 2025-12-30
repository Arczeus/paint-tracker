import pandas as pd

input_file = "colors.xlsx"
output_file = "colors.json"

data = pd.read_excel(input_file, dtype={'code': str})

data['name'] = data['name'].str.strip()
data['name'] = data['name'].str.replace(r'\s*\(\d+\)$', '', regex=True)

data.to_json(output_file, orient='records')
