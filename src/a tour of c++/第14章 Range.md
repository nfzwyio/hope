---
permalink: /cpp/chapter14/
---

# 第14章 Ranges

+ 简介
+ 视图
+ 生成器
+ 管道
+ 概念概览
  + 类型概念；
  + 迭代器概念；
  + 范围概念
+ 建议

## 14.1 简介

标准库提供了使用概念约束的算法和未约束的算法（为了兼容性）。概念约束版本位于 **ranges** 命名空间的 **\<ranges>** 中。自然而然，我更倾向于使用概念的版本。一个 **range** 是对C++98中由{ **begin()** , **end()** }对定义的序列的一般化；它规定了作为元素序列所需具备的条件。

一个 **range** 可以通过以下方式定义：
- 一对{ **begin** , **end** }迭代器
- 一对{ **begin** , **n** }，其中 **begin** 是一个迭代器， **n** 是元素数量
- 一对{ **begin** , **pred** }，其中 **begin** 是一个迭代器， **pred** 是一个谓词；如果对于迭代器 **p** ， **pred(p)** 为真，则表示我们到达了范围的末尾。这允许我们拥有无限范围以及“即时”生成的范围（§14.3）。

正是这个范围概念使得我们能够写出 **sort(v)** 而非 **sort(v.begin(),v.end())** ，这是自1994年以来使用STL所需的方式。对于我们自己的算法，也可以类似操作： 
```cpp
template<forward_range R>
requires sortable<iterator_t<R>>
void my_sort(R& r)// 现代、概念约束版本的my_sort
{
    return my_sort(r.begin(), r.end());// 使用1994风格的sort
}
```
范围允许我们更直接地表达大约99%的算法常见用法。除了符号上的优势外，范围还提供了一些优化机会，并消除了诸如 **sort(v1.begin(),v2.end())** 和 **sort(v.end(),v.begin())** 这一类的“愚蠢错误”。是的，这类错误在实际应用中确实出现过。

自然而然，存在不同种类的范围，对应于不同种类的迭代器。特别是， **input_range** 、 **forward_range** 、 **bidirectional_range** 、 **random_access_range** 和 **contiguous_range** 作为 **概念** 被表示（§14.5）。

## 14.2 视图

 **视图** （Views）是一种观察范围的方式。例如：

```cpp
#include "pch.h";
#include <iostream>;
#include <ranges>;
#include <vector>

using namespace std;
using namespace std::ranges;

static void user(forward_range auto& r) {
    filter_view v{ r, [](int x) { return x % 2; } };
    cout << "奇数: ";
    for (int x : take_view{ v, 4 })
        cout << x << ' ';
}

int main()
{
    vector<int> v{ 1,2,3,4,5,6,7,8,9 };
    
    user(v);//奇数: 1 3 5 7
}
```

当从 **filter_view** 读取时，我们实际上是从其范围读取。如果读取的值满足谓词条件，则返回该值；否则， **filter_view** 会尝试使用范围中的下一个元素。

许多范围可能是无限的。此外，我们常常只需要几个值。因此，存在一些视图用于从范围内仅获取少数几个值：

```cpp
void user(forward_range auto& r)
{
    filter_view v{r, [](int x) { return x%2; } };
    take_view tv {v, 100 }; // 最多从v中取出100个元素
   
    cout << "奇数: ";
    for (int x : tv)
        cout << x << ' ';
}
```

我们可以通过直接使用 **take_view** 来避免为其命名：

```cpp
for (int x : take_view{v, 3})
    cout << x << ' ';
```

对于 **filter_view** 同样可以这样做：

```cpp
for (int x : take_view{ filter_view { r, [](int x) { return x % 2; } }, 3 })
    cout << x << ' ';
```

这种视图嵌套使用的方式可能会有点难以理解，因此还有另一种选择： **管道** （§14.4）。

标准库提供了许多视图，也称为 **范围适配器** （range adaptors）：

<center><strong>标准库视图（范围适配器）    &lt;ranges&gt;</strong></center>

<center><strong>v</strong> 是一个视图；<strong>r</strong> 是一个范围；<strong>p</strong> 是一个谓词；<strong>n</strong> 是一个整数</center>

|                              |                                                              |
| ---------------------------- | ------------------------------------------------------------ |
| **v=all_view{r}**            | **v** 是 **r** 的所有元素                                       |
| **v=filter_view{r,p}**       | **v** 是 **r** 中满足 **p** 的元素                                |
| **v=transform_view{r,f}**    | **v** 是对 **r** 中每个元素应用 **f** 后的结果                    |
| **v=take_view{r,n}**         | **v** 是最多包含 **r** 的前 **n** 个元素                          |
| **v=take_while_view{r,p}**   | **v** 是 **r** 中直到遇到不满足 **p** 的元素为止的所有元素        |
| **v=drop_view{r,n}**         | **v** 是 **r** 的第 **n+1** 个元素开始的剩余元素                  |
| **v=drop_while_view{r,p}**   | **v** 是 **r** 中第一个不满足 **p** 的元素开始的剩余元素          |
| **v=join_view{r}**           | **v** 是 **r** 的扁平化版本； **r** 的元素必须是范围              |
| **v=split_view(r,d)**        | **v** 是根据分隔符 **d** 确定的 **r** 的子范围组成的范围； **d** 可以是元素或范围 |
| **v=common_view(r)**         | **v** 是以 **(begin:end)** 对描述的 **r**                        |
| **v=reverse_view{r}**        | **v** 是反序的 **r** 的元素； **r** 需支持双向访问                |
| **v=views::elements\<n>(r)** | **v** 是 **r** 中每个 **元组** 元素的第 **n** 个元素组成的范围      |
| **v=keys_view{r}**           | **v** 是 **r** 中 **每对** 元素组成的键的范围                     |
| **v=values_view{r}**         | **v** 是 **r** 中 **每对** 元素组成的值的范围                     |
| **v=ref_view{r}**            | **v** 是 **r** 中元素的引用的范围                               |

视图提供了一个与范围非常相似的接口，因此在大多数情况下，我们可以在使用范围的方式和位置上使用视图。关键的区别在于，视图并不拥有其元素；它不负责删除其底层范围的元素——这是范围的责任。另一方面，视图的生命周期不得超过其范围：
```cpp
auto bad()
{
    vector<int> v = {1, 2, 3, 4};
    return filter_view(v, odd); // v 将在此处被销毁，先于视图
} 
```
视图应该是容易复制的，所以我们通过值传递它们。

我使用了简单的标准类型来保持示例简单，但当然，我们也可以拥有针对我们自定义类型的视图。例如：

```cpp
struct Reading {
    int location {};
    int temperature {}; 
    int humidity {}; 
    int air_pressure {}; 
    // ...
};

int average_temp(vector<Reading> readings)
{
    if (readings.size() == 0) throw No_readings{}; 
    double sum = 0;
    for (int temp : views::elements<1>(readings)) // 只查看温度部分
        sum += temp;
    return sum / readings.size(); 
}
```
## 14.3 生成器

很多时候，范围需要即时生成。标准库为此提供了一些简单的 **生成器** （也称为 **工厂** ）：

<center><strong>范围工厂    &lt;ranges &gt;</strong></center>

<center><strong>v</strong> 是一个视图；<strong>x</strong> 是元素类型 <strong>T</strong> 的实例；<strong>is</strong> 是一个输入流<strong>istream</strong></center>

|                            |                                                              |
| -------------------------- | ------------------------------------------------------------ |
| **v=empty_view\<T>{}**     | **v** 是一个空范围，若存在元素则类型为 **T** （即使实际上为空） |
| **v=single_view{x}**       | **v** 是一个只包含单个元素 **x** 的范围                         |
| **v=iota_view{x}**         | **v** 是一个无限范围，元素为 **x, x+1, x+2** , **...** ，递增通过 **++** 实现 |
| **v=iota_view{x,y}**       | **v** 是一个含有 **n** 个元素的范围： **x, x+1, ..., y-1** 递增同样通过 **++** 实现 |
| **v=istream_view\<T>{is}** | **v** 是从输入流 **is** 通过 **>>** 操作读取 **T** 类型的元素形成的范围 |

 **iota_view** 对于生成简单序列非常有用。例如：

```cpp
for (int x : iota_view(42,52))
    cout << x << ' ';// 42 43 44 45 46 47 48 49 50 51
```
 **istream_view** 提供给我们一种简便的方式，在范围 **for** 循环中使用输入流（ **istream** ）：

```cpp
for (auto x : istream_view<complex<double>>(cin))
    cout << x << '\n';
```
与其他视图一样， **istream_view** 可以与其他视图组合：
```cpp
auto cplx = istream_view<complex<double>>(cin);
for (auto x : transform_view(cplx, [](auto z){ return z*z;}))
    cout << x << '\n';
```
如果输入是 **1 2 3** ，则输出为 **1 4 9** 。

## 14.4 管道

对于每个标准库视图（§14.2），标准库都提供了一个生成过滤器的函数；也就是说，一个可以用作过滤器运算符 **|** 参数的对象。例如， **filter()** 会生成一个 **filter_view** 。这允许我们以序列的形式组合过滤器，而不是将它们作为一组嵌套的函数调用呈现。

```cpp
void user(forward_range auto& r)  
{  
    auto odd = [](int x) { return x % 2; };  
}  
for (int x : r | views::filter(odd) | views::take(3))  
    cout << x << ' ';
```

输入范围 **2 4 6 8 20** 会产生输出 **1 2 3** 。

管道风格（使用Unix管道运算符 **|** )被广泛认为比嵌套函数调用更易读。管道从左到右工作；即 **f|g** 表示将 **f** 的结果传递给 **g** ，所以 **r|f|g** 意味着 **(g_filter(f_filter(r)))** 。初始的 **r** 必须是一个范围或生成器。

这些过滤器函数位于命名空间 **ranges::views** 中：

```cpp
void user(forward_range auto& r)  
{  
    for (int x : r | views::filter([](int x) { return x % 2; } ) | views::take(3) )  
        cout << x << ' ';  
}
```

我发现显式使用 **views::** 可以使代码更易读，但我们可以进一步缩短代码：

```cpp
void user(forward_range auto& r)  
{  
    using namespace views;  
    auto odd = [](int x) { return x % 2; };  
}  
for (int x : r | filter(odd) | take(3) )  
    cout << x << ' ';
```

视图和管道的实现涉及一些相当复杂的模板元编程，因此如果你关心性能，请确保测量你的实现是否满足你的需求。如果没有，总是有一个传统的解决方法：

```cpp
void user(forward_range auto& r)  
{  
    int count = 0;  
    for (int x : r)  
        if (x % 2) {  
            cout << x << ' ';  
            if (++count == 3) return;  
        }  
}
```

然而，这里的逻辑被掩盖了。

## 14.5 概念概述

标准库提供了许多有用的概念：

• 定义类型属性的概念（§14.5.1）

• 定义迭代器的概念（§14.5.2）

• 定义范围的概念（§14.5.3）

### 14.5.1 类型概念

与类型属性以及类型之间关系相关的概念反映了类型的多样性。这些概念有助于简化大多数模板。

<center><strong>核心语言概念    &lt;concepts &gt;</strong></center>

<center><strong>T</strong> 和 <strong>U</strong> 是类型。</center>

|                                 |                                                              |
| ------------------------------- | ------------------------------------------------------------ |
| **same_as\<T,U>**               | **T** 与 **U** 相同类型                                         |
| **derived_from\<T,U>**          | **T** 是从 **U** 派生的类型                                     |
| **convertible_to\<T,U>**        | **T** 类型的对象可以转换为 **U** 类型                           |
| **common_reference_with\<T,U>** | **T** 和 **U** 有共同的引用类型                                 |
| **common_with\<T,U>**           | **T** 和 **U** 有共同的类型                                     |
| **integral\<T>**                | **T** 是整数类型                                              |
| **signed_integral\<T>**         | **T** 是有符号整数类型                                        |
| **unsigned_integral\<T>**       | **T** 是无符号整数类型                                        |
| **floating_point\<T>**          | **T** 是浮点类型                                              |
| **assignable_from\<T,U>**       | **U** 类型的对象可以赋值给 **T** 类型对象                       |
| **swappable_with\<T,U>**        | **T** 类型的对象可以与 **U** 类型的对象交换                     |
| **swappable\<T>**               | 特化形式 **swappable_with\<T,T>** ，表示 **T** 类型的对象之间可交换 |

许多算法应该能够与相关类型的组合一起工作，例如，包含 **int** 和 **double** 的混合表达式。我们使用 **common_with** 来表示这种混合是否在数学上是合理的。如果 **common_with<X,Y>** 为真，我们可以使用 **common_type_t<X,Y>** 来比较 **X** 和 **Y** ，首先将它们都转换为 **common_type_t<X,Y>** 。例如：

```cpp
common_type_t<string, const char*> s1 = some_fct();  
common_type_t<string, const char*> s2 = some_other_fct();  
if (s1 < s2) {  
    // ...  
}
```

为了为一对类型指定一个公共类型，我们在 **common** 的定义中特化 **common_type_t** 。例如：

```cpp
using common_type_t<Bigint, long> = Bigint;  
// 对于Bigint的合适定义
```

幸运的是，除非我们想对库还没有合适定义的类型混合进行操作，否则我们不需要定义 **common_type_t** 的特化。

与比较相关的概念在很大程度上受到了[Stepanov,2009]的影响。

<center><strong>比较概念    &lt;concepts &gt;</strong></center>

|                                     |                                                              |
| ----------------------------------- | ------------------------------------------------------------ |
| **equality_comparable_with\<T,U>**  | **T** 和 **U** 类型的对象可以用 **==** 比较是否相等               |
| **equality_comparable\<T>**         | **equality_comparablewith\<T,T>**                            |
| **totally_ordered_with\<T,U>**      | **T** 和 **U** 类型的对象可以用 **<** , **<=** , **>** , 和 **>=** 比较，形成一个全序关系 |
| **totally_ordered\<T>**             | **strict_totally_ordered_with\<T,T>**                        |
| **three_way_comparable_with\<T,U>** | **T** 和 **U** 类型的对象可以用 **<=>** （太空船运算符）比较，得出一致的结果 |
| **three_way_comparable\<T>**        | **three_way_comparable_with\<T,T>**                          |

同时使用 **equality_comparable_with** 和 **equality_comparable** 展示了（到目前为止）一个被忽视的重载概念的机会。

奇怪的是，没有标准的 **boolean** 概念。我经常需要它，所以这里提供一个版本：

```cpp
template<typename B>  
concept Boolean =  
requires(B x, B y) {  
    { x = true }; 
    { x = false }; 
    { x = (x == y) };
    { x = (x != y) }; 
    { x = !x }; 
    { x = (x = y) }; 
};
```

在编写模板时，我们经常需要对类型进行分类。

<center><strong>对象概念    &lt;concepts &gt;</strong></center>

|                                 |                                                              |
| ------------------------------- | ------------------------------------------------------------ |
| **destructible\<T>**            | **T** 类型的对象可以被销毁，并且可以使用 **&** 对其取址         |
| **constructible_from\<T,Args>** | 可以使用类型为 **Args** 的参数列表构造 **T** 类型的对象          |
| **default_initializable\<T>**   | **T** 类型支持默认构造                                        |
| **move_constructible\<T>**      | **T** 类型支持移动构造                                        |
| **copy_constructible\<T>**      | **T** 类型支持拷贝构造                                        |
| **movable\<T>**                 | **move_constructible\<T>** ， **assignable\<T&, T>** ，和 **swappable\<T>** |
| **copyable\<T>**                | **copy_constructable\<T>** , **moveable\<T>** ，和 **assignable\<T, const T&>** |
| **semiregular\<T>**             | **copyable\<T>** 和 **default_initializable\<T>**              |
| **regular\<T>**                 | **semiregular\<T>** 和 **equality_comparable\<T>**             |

类型的理想是 **regular** 。 **regular** 类型大致像 **int** 一样工作，并简化了我们关于如何使用类型的许多思考（(§8.2）。类缺少默认的 **==** 操作符意味着，尽管大多数类都可以也应该是正则（ **regular** ）的，但它们一开始都被视为半正则（ **semiregular** ）的。

每当我们将一个操作作为约束模板参数传递时，我们需要指定如何调用它，有时还需要指定我们对它们语义的假设。

<center><strong>可调用概念&lt;concepts &gt;</strong></center>

|                                 |                                                     |
| ------------------------------- | --------------------------------------------------- |
| **invocable<F,Args>**           | 函数对象 **F** 可以使用类型为 **Args** 的参数列表来调用 |
| **regular_invocable<F,Args>**   | **invocable<F,Args>** 且调用结果保持等价性           |
| **predicate<F,Args>**           | **regular_invocable<F,Args>** 且返回类型为 **bool**   |
| **relation<F,T,U>**             | **predicate\<F,T,U>**                               |
| **equivalence_relation<F,T,U>** | **relation\<F,T,U>** 提供等价关系                    |
| **strict_weak_order<F,T,U>**    | **relation\<F,T,U>** 提供严格的弱排序                |

函数 **f()** 是 **保等性** ( equality preserving)的，如果 **x==y** 则意味着 **f(x)==f(y)** 。一个 **invocable** 和一个 **regular_invocable** 仅在语义上有所不同。我们（目前）无法在代码中表示这种差异，因此这些名称只是表达了我们的意图。

类似地， **关系** 和 **等价关系** （equivalence_relation）也仅在语义上有所不同。等价关系是反身的、对称的和传递的。

 **关系** 和 **严格弱序** （strict_weak_order）也仅在语义上有所不同。严格弱序是标准库通常对比较（如<）所假设的。

### 14.5.2 迭代器概念

传统的标准算法通过迭代器访问其数据，因此我们需要概念来对迭代器类型的属性进行分类。

<center><strong>迭代器概念&lt;concepts &gt;</strong></center>

|                                  |                                                              |
| -------------------------------- | ------------------------------------------------------------ |
| **input_or_output_iterator\<I>** | **I** 是一个可递增（ **++** ）和可解引用（*****）的迭代器       |
| **sentinel_for\<S,I>**           | **S** 是一个 **Iterator** 类型的哨兵；即， **S** 是对 **I** 值类型的谓词 |
| **sized_sentinel_for\<S,I>**     | **S** 是一个哨兵，其中 **-** 运算符可以应用于 **I**              |
| **input_iterator\<I>**           | **I** 是一个输入迭代器；只能使用*****进行读取                 |
| **output_iterator\<I>**          | **I** 是一个输出迭代器；只能使用*****进行写入                 |
| **forward_iterator\<I>**         | **I** 是一个前向迭代器，支持 **multi-pass** 和 **==**           |
| **bidirectional_iterator\<I>**   | **I** 是一个支持 **--** 的 **forward_iterator\<I>**            |
| **random_access_iterator\<I>**   | **I** 是一个支持 **+** , **-** , **+=** , **-=** 以及 **[]** 操作的 **bidirectional_iterator\<I>** |
| **contiguous_iterator\<I>**      | **I** 是用于访问连续内存中元素的 **random_access_iterator\<I>** |
| **permutable\<I>**               | 支持移动和交换的 **forward_iterator\<I>**                    |
| **mergeable\<I1,I2,R,O>**        | 能否使用 **relation\<R>** 合并由I1和I2定义的已排序序列到O中？  |
| **sortable\<I>**                 | 能否使用 **less** 对由I定义的序列进行排序？                    |
| **sortable\<I,R>**               | 能否使用 **relation\<R>** 对由I定义的序列进行排序？            |

 **mergeable** 和 **sortable** 相对于它们在C++20中的定义有所简化。

不同的迭代器（类别）用于为给定的参数集选择最佳算法；见§8.2.2和§16.4.1。关于 **input_iterator** 的示例，见§13.3.1。

哨兵（sentinel）的基本思想是，我们可以从迭代器开始遍历一个范围，直到某个元素的谓词变为真。这样，迭代器 **p** 和哨兵 **s** 就定义了一个范围**[p:s(*p))**。例如，我们可以为遍历C风格字符串的哨兵定义一个谓词，使用指针作为迭代器。不幸的是，这需要一些样板代码，因为我们的目的是将谓词呈现为一种不能与普通迭代器混淆的东西，但你可以将其与用于遍历范围的迭代器进行比较：

```cpp
template<class Iter>  
class Sentinel {  
public:  
    Sentinel(int ee) : end(ee) { }  
    Sentinel() :end(0) {}  // 概念sentinel_for要求有一个默认构造函数  
    friend bool operator==(const Iter& p, Sentinel s) { return (*p == s.end); }  
    friend bool operator!=(const Iter& p, Sentinel s) { return !(p == s); }  
private:  
    iter_value_t<const char*> end;  // 哨兵值  
};
```

 **friend** 声明符允许我们在类的范围内定义用于比较迭代器和哨兵的 **==** 和 **!=** 二元函数。

我们可以检查这个 **Sentinel** 是否满足 **const char\** *的 **sentinel_for** 的要求：

```cpp
static_assert(sentinel_for<Sentinel<const char*>, const char*>); // 检查C风格字符串的Sentinel
```

最后，我们可以编写一个相当奇特的“Hello, World!”程序版本：

```cpp
const char aa[] = "Hello, World!\nBye for now\n";  
ranges::for_each(aa, Sentinel<const char*>('\n'), [](const char x) { cout << x; });
```

是的，这真的写入了 **Hello, World!** ，后面没有换行符。

### 14.5.3 范围概念

范围概念定义了范围的属性。

<center><strong>范围概念&lt;concepts &gt;</strong></center>

|                             |                                                             |
| --------------------------- | ----------------------------------------------------------- |
| **range\<R>**               | **R** 是一个范围，拥有开始迭代器和哨兵                       |
| **sized_range\<R>**         | **R** 是一个范围，可以在常数时间内知道其大小                 |
| **view\<R>**                | **R** 是一个视图，支持常数时间的复制、移动和赋值操作         |
| **common_range\<R>**        | **R** 是一个范围，有相同的迭代器类型和哨兵类型               |
| **input_range\<R>**         | **R** 是一个范围，其迭代器类型满足 **input_iterator**         |
| **output_range\<R>**        | **R** 是一个范围，其迭代器类型满足 **output_iterator**        |
| **forward_range\<R>**       | **R** 是一个范围，其迭代器类型满足 **forward_iterator**       |
| **bidirectional_range\<R>** | **R** 是一个范围，其迭代器类型满足 **bidirectional_iterator** |
| **random_access_range\<R>** | **R** 是一个范围，其迭代器类型满足 **random_access_iterator** |
| **contiguous_range\<R>**    | **R** 是一个范围，其迭代器类型满足 **contiguous_iterator**    |

 **\<ranges>** 中还有一些其他的概念，但上面这些是一个很好的开始。这些概念的主要用途是根据其输入的类型属性来启用实现的重载（§8.2.2）。

## 14.6 建议

1. 当使用迭代器对风格变得繁琐时，尝试使用范围算法；§13.1；§14.1。
2. 使用范围算法时，记得显式地引入其名称；§13.3.1。
3. 对范围的操作可以通过 **视图** 、 **生成器** 和 **过滤器** 来表达为管道；§14.2，§14.3，§14.4。
4. 要以谓词结束一个范围，你需要定义一个哨兵；§14.5。
5. 使用 **static_assert** ，我们可以检查一个特定类型是否满足某个概念的要求；§8.2.4。
6. 如果你需要一个范围算法而标准中没有，可以自己编写；§13.6。
7. 类型的理想是 **regular** ；§14.5。
8. 在适用的情况下，首选标准库中的概念；§14.5。
9. 当请求并行执行时，务必避免数据竞争（§18.2）和死锁（§18.3）；§13.6。