import os, sys
import re


def security_pattern():
    crypto_def = ['javax\.crypto\.spec\.SecretKeySpec', 'javax\.crypto\.Cipher', 'javax\.crypto\.CipherInputStream']
    crypto_api = ['javax\.crypto\.spec\.SecretKeySpec:*\s+void <init>\(byte\[\], java\.lang\.String\)',
    'javax\.crypto\.Cipher getCipher\(java\.lang\.String, java\.lang\.String\)',
        'javax\.crypto\.Cipher:*\s+void init\(int, java\.security\.Key\)',
        'javax\.crypto\.CipherInputStream:*\s+void <init>\(java\.io\.InputStream, javax\.crypto\.Cipher\)',
        'javax\.crypto\.CipherInputStream:*\s+int read\(byte\[\]\)'
    ]

    network_def = ['java\.net\.HttpURLConnection','okhttp3\.RequestBody','okhttp3\.Request','okhttp3\.OkHttpClient','okhttp3\.Call','okhttp3\.MediaType','com\.alibaba\.fastjson\.JSONObject']
    network_api = ['java\.net\.HttpURLConnection:*\s+void setDoOutput\(boolean\)',
    'java\.net\.HttpURLConnection:*\s+void setRequestProperty\(java\.lang\.String, java\.lang\.String\)',
    'okhttp3\.RequestBody:*\s+okhttp3\.RequestBody create\(okhttp3\.MediaType, java\.lang\.String\)',
    'okhttp3\.Request\$Builder:*\s+okhttp3\.Request\$Builder post\(okhttp3\.RequestBody\)',
    'okhttp3\.Request\$Builder:*\s+okhttp3\.Request build\(\)',
    'okhttp3\.Request\$Builder:*\s+okhttp3\.Request\$Builder addHeader\(java\.lang\.String, java\.lang\.String\)',
    'okhttp3\.Request\$Builder:*\s+okhttp3\.Request\$Builder url\(java\.lang\.String\)',
    'okhttp3\.Request\$Builder:*\s+void <init>\(\)']

    db_def = ['android\.database\.sqlite\.SQLiteDatabase', 'android\.database\.Cursor',]
    db_api = ['android\.database\.sqlite\.SQLiteDatabase:*\s+getWritableDatabase\(\)',
    'android\.database\.sqlite\.SQLiteDatabase: android\.database\.Cursor rawQuery\(java\.lang\.String, java\.lang\.String\[\]\)',
    'android\.database\.Cursor: boolean moveToNext\(\)',
    'android\.database\.Cursor: int getInt\(int\)',
    'android\.database\.Cursor: void close\(\)',
    'android\.database\.sqlite\.SQLiteDatabase:*\s+getWritableDatabase\(\)',
    'android\.database\.sqlite\.SQLiteDatabase:*\s+int delete\(java\.lang\.String, java\.lang\.String, java\.lang\.String\[\]\)',
    'android\.database\.sqlite\.SQLiteDatabase:*\s+long replace\(java\.lang\.String, java\.lang\.String, android\.content\.ContentValues\)',
    'android\.database\.sqlite\.SQLiteDatabase:*\s+android\.database\.Cursor query\(java\.lang\.String, java\.lang\.String\[\], java\.lang\.String, java\.lang\.String\[\], java\.lang\.String, java\.lang\.String, java\.lang\.String\)'
    ]

    crypto_def_pattern = []
    crypto_api_pattern = []

    network_def_pattern = []
    network_api_pattern = []

    db_def_pattern = []
    db_api_pattern = []

    for crypto in crypto_def:
        crypto_def_pattern.append(re.compile(crypto, re.MULTILINE))

    for network in network_def:
        network_def_pattern.append(re.compile(network, re.MULTILINE))
    
    for db in db_def:
        db_def_pattern.append(re.compile(db, re.MULTILINE))
    
    for crypto in crypto_api:
        crypto_api_pattern.append(re.compile(crypto, re.MULTILINE))
    
    for network in network_api:
        network_api_pattern.append(re.compile(network, re.MULTILINE))
    
    for db in db_api:
        db_api_pattern.append(re.compile(db, re.MULTILINE))
    
    return [crypto_def_pattern, network_def_pattern, db_def_pattern], [crypto_api_pattern, network_api_pattern, db_api_pattern]


def read_method(f, def_pattern, api_pattern):
    '''
    In soot, if there is a function, it always has following form:
    line_ahead :  function head 
    line_cur   : {
    ......     :  ......
    line_end   : }

    So, in this function, we has rules to recognize the function statements,
    which is
    function -> function head \n { \n statements \n }.
    That is, find a {, we can determine the function head in the line_ahead,
    and find a }, we can end the function.
    '''
    line_cur = ""
    line_ahead = ""

    # read_flag -> should continue to readline?
    read_flag = True
    # func -> the body of a func
    func = ""
    # func_flag -> are we in a func
    func_flag = False
    # method_head -> the method head we need
    method_head = ""
    
    line_cur = f.readline()
    if not line_cur:
        read_flag = False
        return read_flag, None
    
    while line_cur:

        if '{' in line_cur:
            method_head = line_ahead
            func_flag = True

        if '}' in line_cur:
            func_flag = False
            break

        if func_flag:
            func += line_cur
        else:
            line_ahead = line_cur

        line_cur = f.readline()
        if not line_cur:
            read_flag = False
    
    i = 0
    for d in def_pattern:
        for pat in d:
            res = re.findall(pat, func)
            if res:
                i += len(res)
    for a in api_pattern:
        for pat in a:
            res = re.findall(pat, func)
            if res:
                i += len(res)
    if i > 0:
        return [read_flag, method_head]

    return [read_flag, None]


def read_file(path):
    def_pattern, api_pattern = security_pattern()

    f = open(path, 'r')
    methods = []
    read_flag = True
    while read_flag:
        read_flag, method = read_method(f, def_pattern, api_pattern)
        if method:
            methods.append(method)
    f.close()
        
    return methods


def tableGenerator(inputPath, outputPath):
    pat = re.compile(r".*(the_signature_of_the_method: )(<.*>)(signature_done).*")

    methods = read_file(inputPath)

    with open(outputPath, 'w') as f:
        for method in methods:
            txt_write = pat.match(method)
            txt_write.group(2)
            if txt_write:
                txt_write = txt_write.group(2).replace('\n', '').rstrip() + " -> _SINK_\n"
                f.write(txt_write)


tableGenerator(sys.argv[1], "./my_sink.txt")
