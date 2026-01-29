Definir os nomes das colunas para ser compátiveis com a API do ERP que retorna as medições do contratos.

Parametros para retornar as medições.

{
  "tt-param": [
    {
      "nr-contrato": 369, <--- (numero do contrato)
      "cod-estabel": "01", <--- estabelecimento
      "num-seq-item": 1 <--- sequencia do contrato
    }
  ]
}

Definir estabelecimentos

"cod-estabel": "01", << PROMA CONTAGEM
"cod-estabel": "02", << PROMA JUATUBA

Resultado do get no contrato 369 no estabelecimento 01 e sequencia 1
Sistema deve fazer o GET, verificar se os dados batem com o do nosso backend.
Armazenar os dados das medições no primeiro GET, salvar os dados no nosso banco, e a segunda consulta deve ser no nosso banco. Para não consumir muito a API
{
	"total": 1,
	"hasNext": false,
	"items": [
		{
			"TTJson": [
				{
					"num-seq-medicao": 80,
					"cod-estabel": "01",
					"serie-nota": "U",
					"sld-val-medicao": 0.0,
					"num-seq-item": 1,
					"numero-ordem": 20650,
					"val-medicao": 17120.0,
					"dat-medicao": "2026-01-08",
					"sld-rec-medicao": 17120.0,
					"nr-contrato": 369,
					"dat-prev-medicao": "2026-01-08",
					"numero-nota": "0000054",
					"nome-emit": "EMPRESA MINEIRA DE COMPUTADORES LTDA",
					"dat-receb": "2026-01-08",
					"responsavel": "suporteti"
				},
				{
					"num-seq-medicao": 81,
					"cod-estabel": "01",
					"serie-nota": "U",
					"sld-val-medicao": 0.0,
					"num-seq-item": 1,
					"numero-ordem": 20650,
					"val-medicao": 20550.0, <-- 
					"dat-medicao": "2026-01-26",
					"sld-rec-medicao": 20550.0,
					"nr-contrato": 369,
					"dat-prev-medicao": "2026-01-23",
					"numero-nota": "0053818",
					"nome-emit": "EMPRESA MINEIRA DE COMPUTADORES LTDA",
					"dat-receb": "2026-01-26",
					"responsavel": "gfernandes"
				}
			]
		}
	]
}


Get de sequencia do nosso backend
[
	{
		"_id": "697b27b63f67c554e3f5842e",
		"contrato": {
			"_id": "697b278d3f67c554e3f5841f",
			"fornecedor": {
				"_id": "697b27803f67c554e3f5840b",
				"nome": "EMC",
				"id": "697b27803f67c554e3f5840b"
			},
			"numero": 369,
			"estabelecimento": 1,
			"observacao": "",
			"createdAt": "2026-01-29T09:25:33.024Z",
			"updatedAt": "2026-01-29T09:25:33.024Z",
			"__v": 0,
			"id": "697b278d3f67c554e3f5841f"
		},
		"numero": 1,
		"diaEmissao": 25,
		"custo": 20650,
		"statusMensal": {},
		"createdAt": "2026-01-29T09:26:14.326Z",
		"updatedAt": "2026-01-29T09:27:17.232Z",
		"__v": 0
	},
	{
		"_id": "697b280a3f67c554e3f58476",
		"contrato": {
			"_id": "697b278d3f67c554e3f5841f",
			"fornecedor": {
				"_id": "697b27803f67c554e3f5840b",
				"nome": "EMC",
				"id": "697b27803f67c554e3f5840b"
			},
			"numero": 369,
			"estabelecimento": 1,
			"observacao": "",
			"createdAt": "2026-01-29T09:25:33.024Z",
			"updatedAt": "2026-01-29T09:25:33.024Z",
			"__v": 0,
			"id": "697b278d3f67c554e3f5841f"
		},
		"numero": 5,
		"diaEmissao": 25,
		"custo": 64485.63,
		"statusMensal": {},
		"createdAt": "2026-01-29T09:27:38.038Z",
		"updatedAt": "2026-01-29T09:27:38.038Z",
		"__v": 0
	},
	{
		"_id": "697b28253f67c554e3f58488",
		"contrato": {
			"_id": "697b278d3f67c554e3f5841f",
			"fornecedor": {
				"_id": "697b27803f67c554e3f5840b",
				"nome": "EMC",
				"id": "697b27803f67c554e3f5840b"
			},
			"numero": 369,
			"estabelecimento": 1,
			"observacao": "",
			"createdAt": "2026-01-29T09:25:33.024Z",
			"updatedAt": "2026-01-29T09:25:33.024Z",
			"__v": 0,
			"id": "697b278d3f67c554e3f5841f"
		},
		"numero": 7,
		"diaEmissao": 25,
		"custo": 17120,
		"statusMensal": {},
		"createdAt": "2026-01-29T09:28:05.589Z",
		"updatedAt": "2026-01-29T09:28:05.589Z",
		"__v": 0
	}
]