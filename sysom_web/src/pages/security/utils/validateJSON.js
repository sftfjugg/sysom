export async function isJSON(str,param) {

    if (typeof str == 'string') {

        try {
            if(!str)

            return Promise.resolve();

            var obj=JSON.parse(str);

            if(typeof obj == 'object' && obj){

                return Promise.resolve();

            }else{

                return Promise.reject(`请输入正确格式的${param}`);

            }

 

        } catch(e) {

            console.log('error：'+str+'!!!'+e);

            return Promise.reject(`请输入正确格式的${param}`);

        }

    }

    console.log('It is not a string!')

}